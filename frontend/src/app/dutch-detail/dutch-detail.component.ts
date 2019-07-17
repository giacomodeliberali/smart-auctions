import { Component, OnInit } from '@angular/core';
import { DutchAuction as DutchAuctionDto } from '../models/dutch-auction.model';
import { ActivatedRoute } from '@angular/router';
import { ContractsService } from '../services/contracts.service';
import DutchAuctionJson from '../../../../build/contracts/DutchAuction.json';
import { AccountService } from '../services/account.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-dutch-detail',
  templateUrl: './dutch-detail.component.html',
  styleUrls: ['./dutch-detail.component.scss']
})
export class DutchDetailComponent implements OnInit {

  public dutch: DutchAuctionDto;

  private contractAddress: string;
  private contractInstance: any;

  private bid: {
    from: string,
    value: number
  };

  constructor(private route: ActivatedRoute,
    private accountService: AccountService,
    private contractService: ContractsService,
    private snackBar: MatSnackBar) {

  }

  private async fetchAuction() {
    const price = await this.contractInstance.methods.getCurrentPrice.call();
    return new DutchAuctionDto({
      isClosed: await this.contractInstance.methods.isClosed.call() || await this.contractInstance.methods.isOver.call(),
      currentPrice: price ? price.toString() : "",
      itemName: await this.contractInstance.methods.itemName.call(),
      seller: await this.contractInstance.methods.seller.call(),
      owner: await this.contractInstance.methods.owner.call(),
      address: this.contractAddress
    });
  }


  async ngOnInit() {
    this.contractAddress = this.route.snapshot.paramMap.get("address");
    this.contractInstance = this.contractService.getContractAtAddress(DutchAuctionJson.abi, this.contractAddress);

    this.dutch = await this.fetchAuction();

    this.bid = {
      from: this.accountService.currentAccount,
      value: 100
    }

  }

  private async makeBid() {
    return new Promise((resolve, reject) => {
      this.contractInstance.methods
        .makeBid()
        .send({ from: this.bid.from, value: this.bid.value })
        .on('confirmation', async (confirmationNumber, receipt) => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    }).then(() => {
      this.snackBar.open("The bid has been sent", "Ok", { duration: 5000 });
    }).catch(ex => {
      this.snackBar.open("Cannot send the bid", "Ok", { duration: 5000 });
    }).then(async () => {
      this.dutch = await this.fetchAuction();
    });
  }

}
