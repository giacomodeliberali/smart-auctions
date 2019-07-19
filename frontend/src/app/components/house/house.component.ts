import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { AccountService } from '../../services/account.service';
import { Router } from '@angular/router';
import { ethers } from 'ethers';
import { RpcProvider, AuctionHouseFactory } from '../../services/tokens';
import { Auction } from '../../models/interfaces';
import AuctionsHouseJson from '../../../../../build/contracts/AuctionsHouse.json';


@Component({
  selector: 'house',
  templateUrl: './house.component.html'
})
export class HouseComponent implements OnInit {

  /** The binding property of the form */
  public tmpHouseAddress: string;

  /** Indicate if a loading is in progress from blockchain */
  public isLoading = true;

  /** The columns of the table */
  public displayedColumns: Array<string> = [
    "name", "type", "address"
  ];

  /** The items of the table */
  public dataSource: Array<Auction>;

  /** The deployed AuctionHouse contract instance */
  private houseInstance: ethers.Contract;


  constructor(
    @Inject(RpcProvider) private provider: ethers.providers.Web3Provider,
    @Inject(AuctionHouseFactory) private auctionHouseFactory: ethers.ContractFactory,
    private snackBar: MatSnackBar,
    public accountService: AccountService,
    private router: Router) {

    this.setHouseAddress(localStorage.getItem("houseAddress") || "")
  }

  /** Fetches the house past events and subscribe for events of new auctions */
  async ngOnInit() {
    try {
      this.houseInstance = await this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount).deployed();
      this.fetchHouseEvents();
      this.houseInstance.on("NewAuction", () => this.fetchHouseEvents());
    } catch (ex) {
      localStorage.removeItem("houseAddress");
      this.setHouseAddress("");
      this.snackBar.open("The house address does not exist", "Ok", { duration: 5000 });
    }
  }

  /** Unsubscribe from house events */
  ngOnDestroy() {
    this.houseInstance.removeAllListeners("NewAuction");
  }

  /** The set house address on localStorage and sync the from with the model */
  private setHouseAddress(newAddress: string) {
    this.tmpHouseAddress = this.accountService.houseCurrentAccount = newAddress;
    if (newAddress)
      localStorage.setItem("houseAddress", newAddress);
    else
      localStorage.removeItem("houseAddress")
  }

  /** Fetches the events from the blockchain */
  private async onHouseAddressBlur() {
    if (this.tmpHouseAddress.length == 42) {
      // a valid length address
      this.isLoading = true;
      this.setHouseAddress(this.tmpHouseAddress);
      this.houseInstance = await this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount).deployed();
      this.isLoading = false;
      this.snackBar.open("The house address has been updated", "Ok", { duration: 5000 });
    }

    if (!this.tmpHouseAddress || this.tmpHouseAddress.length == 0) {
      this.setHouseAddress("");
    }

    this.fetchHouseEvents();
  }

  // Fetches past events from blockchain (last 100 blocks)
  private async fetchHouseEvents() {
    this.isLoading = true;
    if (!this.accountService.houseCurrentAccount) {
      this.dataSource.splice(0);
      this.isLoading = false;
      return;
    }

    // FIXME: refactor and take data from auction arry in house
    const blockNumber = await this.provider.getBlockNumber();
    let start = 0;
    if (blockNumber > 100)
      start = blockNumber - 100;
    const logs = await this.provider.getLogs({ fromBlock: start, toBlock: 'latest' })
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

    this.isLoading = false;
  }

  /** Go on contract detail page */
  private clickAuction(auction: Auction) {
    this.router.navigate([auction.type.toLowerCase(), auction.address])
  }

  /** Deploy a new AuctionsHouse instance */
  private async deployNewHouse() {
    try {
      this.houseInstance = await this.auctionHouseFactory.deploy()
      this.setHouseAddress(this.houseInstance.address);
      this.snackBar.open("The house has been deployed", "Ok", { duration: 5000 });
    } catch (ex) {
      console.error(ex);
      this.snackBar.open("An error occurred while deploying the AuctionHouse", "Ok", { duration: 5000 });
    }
  }

}
