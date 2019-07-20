import { Component, OnInit, Inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { VickeryAuction, PhaseType } from '../models/vickery-auction.model';
import { ethers } from 'ethers';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../services/account.service';
import { RpcProvider, VickeryAuctionFactory } from '../services/tokens';
import { MatSnackBar } from '@angular/material';
import { VickeryAuctionBid } from '../models/interfaces';
import { ContractHelperService } from '../services/contract-helper-service';
import VickeryAuctionJson from '../../../../build/contracts/VickeryAuction.json';

@Component({
  selector: 'app-vickery-detail',
  templateUrl: './vickery-detail.component.html',
  styleUrls: ['./vickery-detail.component.scss']
})
export class VickeryDetailComponent implements OnInit {

  /** The form values */
  public vickery: VickeryAuction;

  /** The vickery auction instance */
  private contractInstance: ethers.Contract;

  /** The vickery phase type enum exported for template */
  public PhaseType = PhaseType;

  /** Indicate if a loading is in progress */
  public isLoading: boolean;

  /** The bid binding object */
  public bid = {} as VickeryAuctionBid;

  /** Indicate if the current user has already submitted a bid */
  public hasSubmittedBid: boolean;

  /** 
   * The vickery auction events 
   * that need to be subscribed 
   * in order to react and update UI 
   */
  private vickeryEvents = [
    "StateUpdatedEvent",
    "WithdrawalEvent",
    "BidEvent",
    "RefoundEvent",
    "NotEnoughValidBiddersEvent"
  ]

  /** The listener used to update he hasAlreadyBid property */
  private accountChangeHandler: Function;

  constructor(private route: ActivatedRoute,
    public accountService: AccountService,
    @Inject(RpcProvider) private provider: ethers.providers.Web3Provider,
    @Inject(VickeryAuctionFactory) private vickeryAuctionFactory: ethers.ContractFactory,
    private contractHelper: ContractHelperService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef) {
  }

  private listenEvents() {
    this.contractInstance.on("InvalidNonceEvent", (sender: string, value: ethers.utils.BigNumber, nonce: ethers.utils.BigNumber) => {
      if (sender == this.accountService.currentAccount)
        this.snackBar.open("The submitted nonce/value hash is invalid", "Ok");
    });
    this.contractInstance.on("FinalizeEvent", () => {
      this.snackBar.open("The auction has been finalized", "Ok");
    });
    this.contractInstance.on("OpenBidEvent", (sender: string, nonce: ethers.utils.BigNumber, value: ethers.utils.BigNumber) => {
      if (sender == this.accountService.currentAccount)
        this.snackBar.open(`You have opened your bid (${value.toString()} wei) successfully`, "Ok");
    });

    // react to events updating UI
    this.vickeryEvents.forEach(event => {
      this.contractInstance.on(event, () => this.fetchAuction());
    });
  }

  /** Fetch the auction from address and subscribe to events */
  async ngOnInit() {
    const contractAddress = this.route.snapshot.paramMap.get("address");
    try {
      this.isLoading = true;
      this.contractInstance = await this.vickeryAuctionFactory.attach(contractAddress).deployed();

      this.listenEvents();

      await this.checkIfAlreadyHasBid();
      await this.fetchAuction();

    } catch (ex) {
      console.error("#1", ex)
    } finally {
      this.isLoading = false;
    }

    this.accountChangeHandler = () => {
      setTimeout(() => {
        this.ngZone.run(async () => {
          await this.checkIfAlreadyHasBid();
          this.changeDetector.detectChanges();
        });
      });
    }
    (window as any).ethereum.on('accountsChanged', this.accountChangeHandler);
  }

  public async refreshState() {
    this.isLoading = true;
    await this.contractInstance.refreshState();
    await this.fetchAuction();
    this.isLoading = false;
  }

  /** Checks if the current account has already submitted a bid to this contract instance */
  private async checkIfAlreadyHasBid() {
    this.hasSubmittedBid = await this.contractInstance.hasAlreadyBid(this.accountService.currentAccount);
  }

  /** Unsubscribe to all vickery events before leaving the page */
  ngOnDestroy() {
    if (this.contractInstance) {
      this.vickeryEvents.forEach(event => {
        this.contractInstance.removeAllListeners(event);
      });
    }
    (window as any).ethereum.off('accountsChanged', this.accountChangeHandler);
  }

  /** Fetch the vickery from blockchain */
  private async fetchAuction() {
    this.vickery = new VickeryAuction({
      state: await this.contractInstance.state(),
      itemName: await this.contractInstance.itemName(),
      seller: await this.contractInstance.seller(),
      owner: await this.contractInstance.owner(),
      deposit: await this.contractInstance.deposit(),
      address: this.contractInstance.address,
      winner: await this.contractInstance.winner(),
      winnerPrice: await this.contractInstance.winnerPrice()
    });
  }

  private async processTransaction(
    fun: () => Promise<ethers.ContractTransaction>,
    afterComplete?: () => any,
    successMessage: string = "The transaction has been successfully deployed") {

    try {
      this.isLoading = true;
      const tx = await fun();
      await this.provider.waitForTransaction(tx.hash);
      if (afterComplete)
        await afterComplete();
      if (successMessage)
        this.snackBar.open(successMessage, "Ok", { duration: 5000 });
    } catch (ex) {
      this.notifyError(ex);
    } finally {
      await this.fetchAuction();
      this.isLoading = false;
    }
  }

  private notifyError(ex: any) {
    const msg = ex.message.substr(ex.message.lastIndexOf("revert") + "revert".length);
    this.snackBar.open(
      msg || "An error occurred while processing the transaction",
      "Ok",
      { duration: 5000 }
    );
  }

  /** Make a new blind bid */
  public makeBid() {
    this.processTransaction(
      async () => {
        const hash = ethers.utils.keccak256(ethers.utils.formatBytes32String(this.bid.value + this.bid.nonce));
        return this.contractInstance.makeBid(hash, {
          value: ethers.utils.bigNumberify(this.vickery.deposit),
          gasLimit: await this.contractHelper.getEstimateGasFor(this.contractInstance.makeBid)
        });
      },
      () => this.hasSubmittedBid = true,
      "The bid has been deployed"
    );
  }



  /** Ask to withdrawal your deposit */
  public withdrawal() {
    this.processTransaction(
      async () => {
        return this.contractInstance.withdrawal({
          gasLimit: await this.contractHelper.getEstimateGasFor(this.contractInstance.withdrawal)
        });
      },
      null,
      "Half of the deposit has been refunded"
    );
  }

  /** Ask to open your previous bid */
  public openBid() {
    this.processTransaction(
      async () => {
        return this.contractInstance.openBid(ethers.utils.bigNumberify(this.bid.nonce), {
          value: ethers.utils.bigNumberify(this.bid.value),
          gasLimit: await this.contractHelper.getEstimateGasFor(this.contractInstance.openBid)
        });
      },
      null,
      null
    );
  }

  /** Close this auction (self destruction) */
  public terminate() {
    this.processTransaction(
      async () => {
        return this.contractInstance.terminate({
          gasLimit: await this.contractHelper.getEstimateGasFor(this.contractInstance.terminate)
        });
      },
      null,
      "The auction has been terminated"
    );
  }

  /** Finalize the auction to elect winner */
  public async finalize() {
    this.processTransaction(
      async () => {
        return this.contractInstance.finalize({
          gasLimit: await this.contractHelper.getEstimateGasFor(this.contractInstance.finalize)
        });
      },
      null,
      "The auction has been finalized"
    );
  }




}
