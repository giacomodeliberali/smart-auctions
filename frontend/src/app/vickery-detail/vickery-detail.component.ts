import { Component, OnInit, Inject } from '@angular/core';
import { VickeryAuction, PhaseType } from '../models/vickery-auction.model';
import { ethers } from 'ethers';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../services/account.service';
import { RpcProvider, VickeryAuctionFactory } from '../services/tokens';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-vickery-detail',
  templateUrl: './vickery-detail.component.html',
  styleUrls: ['./vickery-detail.component.scss']
})
export class VickeryDetailComponent implements OnInit {
  public vickery: VickeryAuction;
  private contractInstance: ethers.Contract;

  public PhaseType = PhaseType;

  public bid: {
    hash: string,
    nonce: string,
    deposit: string
  } = {} as any;

  private vickeryEvents = [
    "StateUpdatedEvent",
    "WithdrawalEvent",
    "BidEvent",
    "OpenBidEvent",
    "InvalidNonceEvent",
    "FinalizeEvent",
    "RefoundEvent",
    "NotEnoughValidBiddersEvent"
  ]

  constructor(private route: ActivatedRoute,
    public accountService: AccountService,
    @Inject(RpcProvider) private provider: ethers.providers.Web3Provider,
    @Inject(VickeryAuctionFactory) private vickeryAuctionFactory: ethers.ContractFactory,
    private snackBar: MatSnackBar) {
  }

  private async fetchAuction() {
    this.vickery = new VickeryAuction({
      state: await this.contractInstance.state(),
      itemName: await this.contractInstance.itemName(),
      seller: await this.contractInstance.seller(),
      owner: await this.contractInstance.owner(),
      address: this.contractInstance.address
    });
  }


  async ngOnInit() {
    const contractAddress = this.route.snapshot.paramMap.get("address");

    try {
      this.contractInstance = await this.vickeryAuctionFactory.attach(contractAddress).deployed();

      // react to events updating UI
      this.vickeryEvents.forEach(event => {
        this.contractInstance.on(event, () => this.fetchAuction());
      });

      this.fetchAuction();

    } catch (ex) {
      console.log(ex)
    }
  }

  ngOnDestroy() {
    // unsubscribe
    this.vickeryEvents.forEach(event => {
      this.contractInstance.removeAllListeners(event);
    });
  }

  private async makeBid() {
    try {

      let gasLimit = await this.provider.estimateGas(this.contractInstance.makeBid);
      gasLimit = gasLimit.mul(4);


      await this.contractInstance.makeBid(ethers.utils.formatBytes32String(this.bid.hash), {
        value: ethers.utils.bigNumberify(this.bid.deposit),
        gasLimit: ethers.utils.bigNumberify(gasLimit)
      })
      this.snackBar.open("The bid has been sent", "Ok", { duration: 5000 });
    } catch (ex) {
      const msg = ex.message.substr(ex.message.lastIndexOf("revert") + "revert".length);
      this.snackBar.open(msg || "Cannot send the bid", "Ok", { duration: 5000 });
    } finally {
      this.fetchAuction();
    }
  }

  private async withdrawal() {
    try {
      await this.contractInstance.withdrawal()
      this.snackBar.open("Half of the deposit has been transferred back", "Ok", { duration: 5000 });
    } catch (ex) {
      const msg = ex.message.substr(ex.message.lastIndexOf("revert") + "revert".length);
      this.snackBar.open(msg || "Cannot ask withdrawal", "Ok", { duration: 5000 });
    } finally {
      this.fetchAuction();
    }
  }

  private async openBid() {
    try {
      await this.contractInstance.openBid(ethers.utils.bigNumberify(this.bid.nonce))
      this.snackBar.open("You opened successfully your bid", "Ok", { duration: 5000 });
    } catch (ex) {
      const msg = ex.message.substr(ex.message.lastIndexOf("revert") + "revert".length);
      this.snackBar.open(msg || "Cannot open your bid", "Ok", { duration: 5000 });
    } finally {
      this.fetchAuction();
    }
  }

}
