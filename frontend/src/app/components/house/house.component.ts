import { Component, OnInit, ViewChild, Inject, Input, NgZone } from '@angular/core';
import { MatExpansionPanel, MatSnackBar } from '@angular/material';
import Web3 from 'web3';
import { WEB3 } from '../../services/tokens';
import DutchAuctionJson from '../../../../../build/contracts/DutchAuction.json';
import AuctionsHouseJson from '../../../../../build/contracts/AuctionsHouse.json';
import { AccountService } from '../../services/account.service';
import { ContractsService } from 'src/app/services/contracts.service';
import { ReturnStatement } from '@angular/compiler';
import { Router } from '@angular/router';

interface Auction {
  name: string;
  type: string;
  address: string;
}

@Component({
  selector: 'house',
  templateUrl: './house.component.html'
})
export class HouseComponent implements OnInit {

  private tmpHouseAddress: string;

  private displayedColumns: Array<string> = [
    "name", "type", "address"
  ];
  private dataSource: Array<Auction> = []


  constructor(
    @Inject(WEB3) private web3: Web3,
    private snackBar: MatSnackBar,
    private accountService: AccountService,
    private contractsService: ContractsService,
    private router: Router,
    private ngZone: NgZone) {

    this.setHouseAddress(localStorage.getItem("houseAddress") || "")
  }

  ngOnInit(): void {
    this.fetchHouseEvents();
  }

  private setHouseAddress(newAddress: string) {
    this.tmpHouseAddress = this.accountService.houseCurrentAccount = newAddress;
    if (newAddress)
      localStorage.setItem("houseAddress", newAddress);
    else
      localStorage.removeItem("houseAddress")
  }

  private async onHouseAddressBlur() {
    if (this.tmpHouseAddress.length == 42) {
      this.setHouseAddress(this.tmpHouseAddress);
      this.snackBar.open("The house address has been updated", "Ok", { duration: 5000 });
    }

    if (!this.tmpHouseAddress || this.tmpHouseAddress.length == 0) {
      this.setHouseAddress("");
    }

    this.fetchHouseEvents();
  }

  private async fetchHouseEvents() {
    if (!this.accountService.houseCurrentAccount) {
      this.dataSource.splice(0);
      return;
    }

    const contract = await this.contractsService.getContractAtAddress(AuctionsHouseJson.abi, this.accountService.houseCurrentAccount);
    console.log(contract)
    const events = await contract.getPastEvents("NewAuction", {});
    console.log("events of house => ", events)

    console.log("Owner of house => ", await contract.methods.owner().call())
    console.log("auctionIndex of house => ", await contract.methods.getAuctionsCount().call())
    console.log("getAuctions of house => ", await contract.methods.getAuctions().call())

  }

  private clickAuction(auction: Auction) {
    this.router.navigate(['dutch', auction.address])
  }

  private async deployNewHouse() {

    const contract = new this.web3.eth.Contract(AuctionsHouseJson.abi as any);

    const gas = await contract.deploy({
      data: AuctionsHouseJson.bytecode
    }).estimateGas();

    contract.deploy({
      data: AuctionsHouseJson.bytecode
    })
      .send({
        from: this.accountService.currentAccount,
        gas: gas
      })
      .on('confirmation', async (confirmationNumber, receipt) => {
        this.ngZone.run(() => {
          const contractAddress = receipt.contractAddress;
          const instance = new this.web3.eth.Contract(AuctionsHouseJson.abi as any, contractAddress);
          this.setHouseAddress(instance.address);
          this.snackBar.open("The house has been deployed", "Ok", { duration: 5000 });
        });
      })
      .on('error', (error) => {
        console.error(error)
      });
  }

}
