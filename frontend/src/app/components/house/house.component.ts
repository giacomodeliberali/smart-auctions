import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { AccountService } from '../../services/account.service';
import { Router, PreloadAllModules } from '@angular/router';
import { ethers } from 'ethers';
import { RpcProvider, AuctionHouseFactory, VickeryAuctionFactory, DutchAuctionFactory, AbstractAuctionFactory } from '../../services/tokens';
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
  public isLoading: boolean;

  /** The current block number */
  public currentBlock: number;

  /** Indicate if the Evm is mining a block */
  public isMiningBlock: boolean;

  /** The number of block to mine */
  public mineNumberBlocks: number = 10;

  /** The columns of the table */
  public displayedColumns: Array<string> = [
    "name", "type", "address", "seller"
  ];

  /** The items of the table */
  public dataSource: Array<Auction>;

  /** The deployed AuctionHouse contract instance */
  private houseInstance: ethers.Contract;

  /** Indicate if the current network provider is local or not */
  public isLocalNetwork: boolean = false;


  constructor(
    @Inject(RpcProvider) public provider: ethers.providers.Web3Provider,
    @Inject(AuctionHouseFactory) private auctionHouseFactory: ethers.ContractFactory,
    @Inject(AbstractAuctionFactory) private abstractAuctionFactory: ethers.ContractFactory,
    private snackBar: MatSnackBar,
    public accountService: AccountService,
    private router: Router) {

    this.setHouseAddress(localStorage.getItem("houseAddress") || "");

      this.isLocalNetwork = (window as any).web3.currentProvider.networkVersion == "5777"; // ganache
  }

  private registerListeners() {
    this.houseInstance.on("NewAuction", () => this.fetchHouseEvents());
  }

  /** Fetches the house past events and subscribe for events of new auctions */
  async ngOnInit() {
    try {
      if (this.accountService.houseCurrentAccount) {
        this.houseInstance = await this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount).deployed();
        this.fetchHouseEvents();
        this.registerListeners();
      }
    } catch (ex) {
      localStorage.removeItem("houseAddress");
      this.setHouseAddress("");
    }
    this.currentBlock = await this.provider.getBlockNumber();
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
  public async loadHouseFromAddress() {
    if (this.tmpHouseAddress.length == 42) {
      // a valid length address
      this.isLoading = true;
      this.setHouseAddress(this.tmpHouseAddress);
      this.houseInstance = await this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount).deployed();
      this.isLoading = false;
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
      if (this.dataSource)
        this.dataSource.splice(0);
      this.isLoading = false;
      return;
    }

    const auctionsAddresses: Array<string> = await this.houseInstance.getAuctions();
    this.dataSource = await Promise.all(auctionsAddresses.map(async address => {
      const contract = await this.abstractAuctionFactory.attach(address).deployed();
      return {
        name: await contract.itemName(),
        type: await contract.auctionType(),
        seller: await contract.seller(),
        address: contract.address
      }
    }));

    this.isLoading = false;
  }

  /** Go on contract detail page */
  public clickAuction(auction: Auction) {
    this.router.navigate([auction.type.toLowerCase(), auction.address])
  }

  /** Deploy a new AuctionsHouse instance */
  public async deployNewHouse() {
    try {
      this.isLoading = true;
      this.houseInstance = await this.auctionHouseFactory.deploy().then(contract => contract.deployed());
      this.setHouseAddress(this.houseInstance.address);
      this.registerListeners();
      this.fetchHouseEvents();
      this.snackBar.open("The house has been deployed", "Ok", { duration: 5000 });
    } catch (ex) {
      console.error(ex);
      this.snackBar.open("An error occurred while deploying the AuctionHouse", "Ok", { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  public emptyHouseAddress() {
    this.setHouseAddress("");
  }

  public async mineBlocks() {
    this.isMiningBlock = true;
    for (let i = 0; i < this.mineNumberBlocks; i++) {
      await this.provider.send("evm_mine", []);
    }
    this.currentBlock = await this.provider.getBlockNumber();
    this.isMiningBlock = false;
  }

}
