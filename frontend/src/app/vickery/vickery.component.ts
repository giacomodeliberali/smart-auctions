import { Component, OnInit, Inject } from '@angular/core';
import { VickeryAuction } from '../models/vickery-auction.model';
import { AuctionHouseFactory } from '../services/tokens';
import { ethers } from 'ethers';
import { AccountService } from '../services/account.service';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vickery',
  templateUrl: './vickery.component.html',
  styleUrls: ['./vickery.component.scss']
})
export class VickeryComponent implements OnInit {

  public vickery: VickeryAuction;

  constructor(
    @Inject(AuctionHouseFactory) private auctionHouseFactory: ethers.ContractFactory,
    private accountService: AccountService,
    private snackBar: MatSnackBar,
    private router: Router) {

    this.vickery = new VickeryAuction({
      bidPhaseLength: "10",
      withdrawalPhaseLength: "10",
      commitmentPhaseLength: "10",
      itemName: "KTM 1190 Adventure R",
      deposit: ethers.utils.parseEther("0.001").toString(),
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

  async deployVickeryAuction() {
    try {

      console.log(this.vickery);

      const contract = this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount);

      const tx = await contract.newVickery(
        this.vickery.itemName,
        this.vickery.seller,
        this.vickery.commitmentPhaseLength,
        this.vickery.withdrawalPhaseLength,
        this.vickery.bidPhaseLength,
        this.vickery.deposit
      );

      console.log(tx)

      this.snackBar.open("The vickery auction has been deployed", "Ok", { duration: 5000 });
      this.router.navigate(['/']);

    } catch (ex) {
      this.snackBar.open("The vickery auction has NOT been deployed", "Ok", { duration: 5000 });
      console.error(ex);
    }
  }

}
