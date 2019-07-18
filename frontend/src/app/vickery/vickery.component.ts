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
export class VickeryComponent {

  public vickery: VickeryAuction;

  constructor(
    @Inject(AuctionHouseFactory) private auctionHouseFactory: ethers.ContractFactory,
    private accountService: AccountService,
    private snackBar: MatSnackBar,
    private router: Router) {

    this.vickery = new VickeryAuction({
      bidPhaseLength: "100",
      withdrawalPhaseLength: "100",
      commitmentPhaseLength: "100",
      itemName: "KTM 1190 Adventure R",
      deposit: ethers.utils.parseEther("1").toString(),
      seller: this.accountService.currentAccount
    });
  }

  async deployVickeryAuction() {
    try {
      const contract = this.auctionHouseFactory.attach(this.accountService.houseCurrentAccount);

      await contract.newVickery(
        this.vickery.itemName,
        this.vickery.seller,
        this.vickery.commitmentPhaseLength,
        this.vickery.withdrawalPhaseLength,
        this.vickery.bidPhaseLength,
        this.vickery.deposit
      );

      this.snackBar.open("The vickery auction has been deployed", "Ok", { duration: 5000 });
      this.router.navigate(['/']);

    } catch (ex) {
      this.snackBar.open("The vickery auction has NOT been deployed", "Ok", { duration: 5000 });
      console.error(ex);
    }
  }

}
