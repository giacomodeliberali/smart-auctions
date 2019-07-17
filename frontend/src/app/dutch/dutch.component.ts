import { Component, OnInit, NgZone } from '@angular/core';
import { ContractsService } from '../services/contracts.service';
import LinearStrategyJson from '../../../../build/contracts/LinearStrategy.json';
import AuctionsHouseJson from '../../../../build/contracts/AuctionsHouse.json';
import { AccountService } from '../services/account.service';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { DutchAuction } from '../models/dutch-auction.model';



@Component({
  selector: 'app-dutch',
  templateUrl: './dutch.component.html',
  styleUrls: ['./dutch.component.scss']
})
export class DutchComponent {

  private dutch: DutchAuction;

  constructor(
    private contractService: ContractsService,
    private accountService: AccountService,
    private snackBar: MatSnackBar,
    private router: Router,
    private ngZone: NgZone) {

    this.dutch = new DutchAuction({
      initialPrice: 2000,
      itemName: "Macbook Pro 15",
      reservePrice: 1000,
      lastForBlocks: 100,
    });
  }

  async deploy() {
    if (!this.dutch.strategy) {
      const linearStrategy = await this.contractService.deployContract(
        LinearStrategyJson.abi,
        LinearStrategyJson.bytecode,
        this.accountService.currentAccount
      );
      this.dutch.strategy = linearStrategy.address;
      this.snackBar.open("The linear strategy has been deployed", "Ok", { duration: 5000 });
    }

    const house = this.contractService.getContractAtAddress(AuctionsHouseJson.abi, this.accountService.houseCurrentAccount);
    house.methods.newDutch(
      this.dutch.itemName,
      this.dutch.seller,
      this.dutch.reservePrice,
      this.dutch.initialPrice,
      this.dutch.lastForBlocks,
      this.dutch.strategy
    )
      .send({ from: this.accountService.currentAccount })
      .on('confirmation', async (confirmationNumber, receipt) => {
        this.ngZone.run(() => {
          this.snackBar.open("The dutch auction has been deployed", "Ok", { duration: 5000 });
          this.router.navigate(['/']);
        });
      })
      .on('error', (error) => {
        console.error(error)
      });



  }

}
