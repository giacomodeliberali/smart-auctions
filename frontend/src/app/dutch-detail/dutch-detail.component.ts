import { Component, OnInit, Inject } from '@angular/core';
import { DutchAuction } from '../models/dutch-auction.model';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../services/account.service';
import { MatSnackBar } from '@angular/material';
import { ethers } from 'ethers';
import { DutchAuctionFactory, RpcProvider } from '../services/tokens';
import { CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY } from '@angular/cdk/overlay/typings/overlay-directives';
import { DutchAuctionBid } from '../models/interfaces';
import { FallbackProvider } from 'ethers/providers';
import { ContractHelperService } from '../services/contract-helper-service';

@Component({
  selector: 'app-dutch-detail',
  templateUrl: './dutch-detail.component.html',
  styleUrls: ['./dutch-detail.component.scss']
})
export class DutchDetailComponent implements OnInit {

  /** The form values */
  public dutch: DutchAuction;

  /** The DutchAuction contract instance */
  private contractInstance: ethers.Contract;

  /** The bid values */
  public bid: DutchAuctionBid;

  /** Indicate if a loading is in progress */
  public isLoading: boolean;

  constructor(private route: ActivatedRoute,
    public accountService: AccountService,
    @Inject(RpcProvider) private provider: ethers.providers.Web3Provider,
    @Inject(DutchAuctionFactory) private dutchAuctionFactory: ethers.ContractFactory,
    private contractHelper: ContractHelperService,
    private snackBar: MatSnackBar) {
  }

  /** Fetches the auction from blockchain */
  private async fetchAuction() {
    const isClosed = await this.contractInstance.isClosed() || await this.contractInstance.isOver();
    const price = isClosed ? "" : await this.contractInstance.getCurrentPrice();
    return new DutchAuction({
      isClosed: isClosed,
      currentPrice: price.toString(),
      itemName: await this.contractInstance.itemName(),
      seller: await this.contractInstance.seller(),
      owner: await this.contractInstance.owner(),
      bidder: await this.contractInstance.bidder() || "",
      address: this.contractInstance.address
    });
  }

  /** Fetch the auction's details */
  async ngOnInit() {

    const contractAddress = this.route.snapshot.paramMap.get("address");


    try {
      this.isLoading = true;
      this.contractInstance = await this.dutchAuctionFactory.attach(contractAddress).deployed();

      this.dutch = await this.fetchAuction();

      this.bid = {
        value: 100
      }
    } catch (ex) {
      console.log(ex)
    } finally {
      this.isLoading = false;
    }
  }

  /** Make a new bid from current address */
  public async makeBid() {
    try {
      this.isLoading = true;

      const tx = await this.contractInstance.makeBid({
        value: ethers.utils.bigNumberify(this.bid.value),
        gasLimit: await this.contractHelper.getEstimateGasFor(this.contractInstance.makeBid)
      });

      await this.provider.waitForTransaction(tx.hash); //FIXME: Yes or no?

      this.snackBar.open("The bid has been processed", "Ok", { duration: 5000 });
    } catch (ex) {
      console.error(ex);
      const msg = ex.message.substr(ex.message.lastIndexOf("revert") + "revert".length);
      this.snackBar.open(msg || "Cannot send the bid", "Ok", { duration: 5000 });
    } finally {
      this.dutch = await this.fetchAuction();
      this.isLoading = false;
    }
  }

  public async terminate() {
    try {
      this.isLoading = true;
      const tx = await this.contractInstance.terminate({
        gasLimit: await this.contractHelper.getEstimateGasFor(this.contractInstance.terminate)
      });
      await this.provider.waitForTransaction(tx.hash); //FIXME: Yes or no?
      this.snackBar.open("The contract is now closed", "Ok", { duration: 5000 });
    } catch (ex) {
      this.snackBar.open("An error occurred while sending terminate command", "Ok", { duration: 5000 });
    } finally {
      this.dutch = await this.fetchAuction();
      this.isLoading = false;
    }
  }

}
