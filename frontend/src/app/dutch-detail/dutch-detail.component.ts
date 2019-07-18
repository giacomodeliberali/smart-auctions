import { Component, OnInit, Inject } from '@angular/core';
import { DutchAuction as DutchAuctionDto } from '../models/dutch-auction.model';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../services/account.service';
import { MatSnackBar } from '@angular/material';
import { ethers } from 'ethers';
import { DutchAuctionFactory, RpcProvider } from '../services/tokens';
import { CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY } from '@angular/cdk/overlay/typings/overlay-directives';

@Component({
  selector: 'app-dutch-detail',
  templateUrl: './dutch-detail.component.html',
  styleUrls: ['./dutch-detail.component.scss']
})
export class DutchDetailComponent implements OnInit {

  public dutch: DutchAuctionDto;
  private contractInstance: ethers.Contract;

  private bid: {
    from: string,
    value: number
  };

  constructor(private route: ActivatedRoute,
    public accountService: AccountService,
    @Inject(RpcProvider) private provider: ethers.providers.Web3Provider,
    @Inject(DutchAuctionFactory) private dutchAuctionFactory: ethers.ContractFactory,
    private snackBar: MatSnackBar) {

  }

  private async fetchAuction() {
    const price = await this.contractInstance.getCurrentPrice();
    return new DutchAuctionDto({
      isClosed: await this.contractInstance.isClosed() || await this.contractInstance.isOver(),
      currentPrice: price ? price.toString() : "",
      itemName: await this.contractInstance.itemName(),
      seller: await this.contractInstance.seller(),
      owner: await this.contractInstance.owner(),
      bidder: await this.contractInstance.bidder() || "",
      address: this.contractInstance.address
    });
  }


  async ngOnInit() {
    const contractAddress = this.route.snapshot.paramMap.get("address");
    this.contractInstance = this.dutchAuctionFactory.attach(contractAddress);

    this.dutch = await this.fetchAuction();

    this.bid = {
      from: this.accountService.currentAccount,
      value: 100
    }

  }

  private async makeBid() {
    try {

      let gasLimit = await this.provider.estimateGas(this.contractInstance.makeBid);
      gasLimit = gasLimit.mul(4);


      await this.contractInstance.makeBid({
        value: ethers.utils.bigNumberify(this.bid.value),
        gasLimit: ethers.utils.bigNumberify(3000000)
      })
      this.snackBar.open("The bid has been sent", "Ok", { duration: 5000 });
    } catch (ex) {
      console.log(ex);
      this.snackBar.open("Cannot send the bid", "Ok", { duration: 5000 });
    } finally {
      this.dutch = await this.fetchAuction();
    }
  }

}
