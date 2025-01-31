import { Component, OnInit, NgZone, Inject, ChangeDetectorRef } from '@angular/core';
import LinearStrategyJson from '../../../../build/contracts/LinearStrategy.json';
import AuctionsHouseJson from '../../../../build/contracts/AuctionsHouse.json';
import { AccountService } from '../services/account.service';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { DutchAuction } from '../models/dutch-auction.model';
import { LinearStrategyFactory, AuctionHouseFactory } from '../services/tokens.js';
import { ethers } from 'ethers';



@Component({
  selector: 'app-dutch',
  templateUrl: './dutch.component.html',
  styleUrls: ['./dutch.component.scss']
})
export class DutchComponent {

  /** The dutch auction form values */
  public dutch: DutchAuction;

  /** Indicate if a loading is in progress */
  public isLoading: boolean;

  /** Indicate if a loading is in progress regarding the LinearStrategy */
  public isStrategyLoading: boolean;

  constructor(
    @Inject(LinearStrategyFactory) private linearStrategyFactory: ethers.ContractFactory,
    @Inject(AuctionHouseFactory) private auctionHouseFactory: ethers.ContractFactory,
    private accountService: AccountService,
    private snackBar: MatSnackBar,
    private router: Router,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef) {

    // initialize with dummy content
    this.dutch = new DutchAuction({
      initialPrice: 2000,
      itemName: "MacBook Pro 15",
      reservePrice: 1000,
      lastForBlocks: 100,
      strategy: localStorage.getItem("linearStrategyAddress") || null,
      seller: this.accountService.currentAccount
    });

  }

  ngOnInit() {

    if (!this.accountService.houseCurrentAccount) {
      this.router.navigate(['/']);
      this.snackBar.open("Before contract creation please select an AuctionHouse", "Ok", { duration: 5000 });
      return;
    }
  }

  /** Deploy a new LinearStrategy contract */
  async deployLinearStrategy() {
    try {
      this.isStrategyLoading = true;
      const instance = await this.linearStrategyFactory
        .deploy()
        .then(contract => contract.deployed());

      this.dutch.strategy = instance.address;
      this.snackBar.open("The LinearStrategy has been deployed", "Ok", { duration: 5000 });
    } catch (ex) {
      this.snackBar.open("An error occurred while deploying the LinearStrategy", "Ok", { duration: 5000 });
    } finally {
      this.isStrategyLoading = false;
    }
  }

  /** Deploy a new LinearStrategy contract, calling the AuctionHouse.newDutch method */
  async deployDutchAuction() {

    try {

      if (!this.dutch.strategy) {
        this.snackBar.open("First deploy or select a strategy", "Ok", { duration: 5000 });
        return;
      }

      this.isLoading = true;

      const linearStrategyAddress = await this.linearStrategyFactory
        .attach(this.dutch.strategy)
        .deployed()
        .then(instance => instance.address)
        .catch(() => null);

      if (!linearStrategyAddress) {
        localStorage.removeItem("linearStrategyAddress")
        this.dutch.strategy = "";
        this.isLoading = false;
        this.snackBar.open("Select a valid strategy before deploy", "Ok", { duration: 5000 });
        return;
      }


      localStorage.setItem("linearStrategyAddress", this.dutch.strategy);


      const contract = this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount);


      await contract.newDutch(
        this.dutch.itemName,
        this.dutch.seller,
        this.dutch.reservePrice,
        this.dutch.initialPrice,
        this.dutch.lastForBlocks,
        this.dutch.strategy
      );

      this.snackBar.open("The dutch auction has been sent", "Ok", { duration: 5000 })
        .afterDismissed()
        .toPromise()
        .then(() => {
          this.router.navigate(['/']);
        });


    } catch (ex) {
      console.error(ex);
      this.snackBar.open("Error deploying the auction", "Ok", { duration: 5000 });
    } finally {
      this.isLoading = false;
    }

  }

}
