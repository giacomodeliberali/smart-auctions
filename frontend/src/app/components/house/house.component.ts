import { Component, OnInit, ViewChild, Inject, Input } from '@angular/core';
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
    private router: Router) {

    this.setHouseAddress(localStorage.getItem("houseAddress") || null)
  }

  ngOnInit(): void {
    this.fetchHouseEvents();
  }

  private setHouseAddress(newAddress: string) {
    this.tmpHouseAddress = this.accountService.houseCurrentAccount = newAddress;
    localStorage.setItem("houseAddress", newAddress);
  }

  private async onHouseAddressBlur() {
    if (this.tmpHouseAddress.length == 42) {
      this.setHouseAddress(this.tmpHouseAddress);
      this.snackBar.open("The house address has been updated", "Ok", { duration: 5000 });
    }

    if (!this.tmpHouseAddress || this.tmpHouseAddress.length == 0) {
      this.setHouseAddress(null);
      this.snackBar.open("The house address has been removed", "Ok", { duration: 5000 });
    }

    this.fetchHouseEvents();
  }

  private async fetchHouseEvents() {
    if (!this.accountService.houseCurrentAccount) {
      this.dataSource.splice(0);
      return;
    }

    const events = await this.contractsService.getContractAtAddress(AuctionsHouseJson.abi, this.accountService.houseCurrentAccount).getPastEvents("NewAuction", {})
    this.dataSource = events.map(e => {
      return {
        name: e.returnValues._itemName,
        address: e.returnValues._address,
        type: e.returnValues._type
      }
    });
  }

  private clickAuction(auction: Auction) {
    this.router.navigate(['dutch', auction.address])
  }

  private async deployNewHouse() {
    const instance = await this.contractsService.deployContract(AuctionsHouseJson.abi, AuctionsHouseJson.bytecode, this.accountService.currentAccount);
    this.setHouseAddress(instance.address);
  }

}
