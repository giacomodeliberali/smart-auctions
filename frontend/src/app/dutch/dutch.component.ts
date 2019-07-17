import { Component, OnInit, NgZone, Inject } from '@angular/core';
import { ContractsService } from '../services/contracts.service';
import LinearStrategyJson from '../../../../build/contracts/LinearStrategy.json';
import AuctionsHouseJson from '../../../../build/contracts/AuctionsHouse.json';
import { AccountService } from '../services/account.service';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { DutchAuction } from '../models/dutch-auction.model';
import Web3 from 'web3';
import { WEB3 } from '../services/tokens';



@Component({
  selector: 'app-dutch',
  templateUrl: './dutch.component.html',
  styleUrls: ['./dutch.component.scss']
})
export class DutchComponent {

  public dutch: DutchAuction;

  constructor(
    private contractService: ContractsService,
    private accountService: AccountService,
    private snackBar: MatSnackBar,
    private router: Router,
    private ngZone: NgZone,
    @Inject(WEB3) private web3: Web3) {

    this.dutch = new DutchAuction({
      initialPrice: 2000,
      itemName: "Macbook Pro 15",
      reservePrice: 1000,
      lastForBlocks: 100,
    });
  }

  async deployLinearStrategy() {
    const contract = new this.web3.eth.Contract(LinearStrategyJson.abi as any);

    const gas = await contract.deploy({
      data: LinearStrategyJson.bytecode
    }).estimateGas();


    contract.deploy({
      data: LinearStrategyJson.bytecode
    })
      .send({
        from: this.accountService.currentAccount,
        gas: gas
      })
      .on('confirmation', async (confirmationNumber, receipt) => {
        this.ngZone.run(() => {
          const contractAddress = receipt.contractAddress;
          const instance = new this.web3.eth.Contract(LinearStrategyJson.abi as any, contractAddress);
          this.dutch.strategy = instance.address;
          this.snackBar.open("The LinearStrategy has been deployed", "Ok", { duration: 5000 });
        });
      })
      .on('error', (error) => {
        console.error(error)
      });
  }

  async deployDutchAuction() {

    if (!this.dutch.strategy) {
      this.snackBar.open("First deploy or select a strategy", "Ok", { duration: 5000 });
      return;
    }


    const contract = this.contractService.getContractAtAddress(AuctionsHouseJson.abi, this.accountService.houseCurrentAccount);

    contract.events.NewAuction({},()=>{
      console.log("NewAuction event")
    });

    const dutchAddress = await contract.methods.newDutch(
      this.dutch.itemName,
      this.dutch.seller,
      this.dutch.reservePrice,
      this.dutch.initialPrice,
      this.dutch.lastForBlocks,
      this.dutch.strategy
    ).call();
    console.log("DUTCH ADD => " + dutchAddress)

    contract.getPastEvents("NewAuction", {}).then(e => console.log("PAST EVENTS => ", e));

    this.ngZone.run(() => {
      this.snackBar.open("The dutch auction has been deployed", "Ok", { duration: 5000 });
      this.router.navigate(['/']);
    });


  }

}
