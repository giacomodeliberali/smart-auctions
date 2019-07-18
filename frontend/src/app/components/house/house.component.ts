import { Component, OnInit, ViewChild, Inject, Input, NgZone } from '@angular/core';
import { MatExpansionPanel, MatSnackBar } from '@angular/material';
import { AccountService } from '../../services/account.service';
import { ReturnStatement } from '@angular/compiler';
import { Router } from '@angular/router';
import { ethers } from 'ethers';
import { RpcProvider, AuctionHouseFactory } from '../../services/tokens';
import AuctionsHouseJson from '../../../../../build/contracts/AuctionsHouse.json';

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
    @Inject(RpcProvider) private provider: ethers.providers.Web3Provider,
    @Inject(AuctionHouseFactory) private auctionHouseFactory: ethers.ContractFactory,
    private snackBar: MatSnackBar,
    private accountService: AccountService,
    private router: Router,
    private ngZone: NgZone) {

    this.setHouseAddress(localStorage.getItem("houseAddress") || "")
  }

  ngOnInit(): void {
    this.fetchHouseEvents();

    const contract = this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount);
    contract.on("NewAuction", () => this.fetchHouseEvents());
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

    console.log(await this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount).getAuctions())

    const logs = await this.provider.getLogs({ fromBlock: 0, toBlock: 'latest' })
    const houseInterface = new ethers.utils.Interface(AuctionsHouseJson.abi);

    this.dataSource = logs.map(log => {
      const parsed = houseInterface.parseLog(log);
      if (parsed)
        return {
          address: parsed.values["0"],
          type: parsed.values["1"],
          name: parsed.values["2"]
        };
    }).filter(p => !!p);
  }

  private clickAuction(auction: Auction) {
    this.router.navigate(['dutch', auction.address])
  }

  private async deployNewHouse() {
    const instance = await this.auctionHouseFactory.deploy()
    this.setHouseAddress(instance.address);
    this.snackBar.open("The house has been deployed", "Ok", { duration: 5000 });
  }

}
