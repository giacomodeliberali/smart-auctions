import { Component, Inject, ChangeDetectorRef, NgZone } from '@angular/core';
import TruffleContract from 'truffle-contract';

import LinearStrategyJson from '../../../build/contracts/LinearStrategy.json';
//import LinearStrategyAbi from './LinearStrategy.json';
import DutchAuctionAbi from '../../../build/contracts/DutchAuction.json';
import { AccountService } from './services/account.service';
import { MatSnackBar } from '@angular/material';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  private _window: any = window;

  constructor(
    public accountService: AccountService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.init();
    // subscribe to metamask's account change event
    if (this._window.ethereum) {
      this._window.ethereum.on('accountsChanged', accounts => {
        this.ngZone.run(() => {
          // https://github.com/MetaMask/metamask-extension/issues/5826
          this.accountService.currentAccount = this._window.web3.toChecksumAddress(accounts[0]);
          this.changeDetector.detectChanges();
          this.snackBar.open("The account has been changed", "Ok", { duration: 5000 });
        });
      })
    } else {
      this.snackBar.open("Please install and enable Metamask", "Ok");
    }

  }

  /** Connects to metamask account */
  async init() {
    if (this._window.ethereum) {
      const accounts = await this._window.ethereum.enable();

      // https://github.com/MetaMask/metamask-extension/issues/5826
      this.accountService.currentAccount = this._window.web3.toChecksumAddress(accounts[0]);

      this.accountService.houseCurrentAccount = localStorage.getItem("houseAddress");
      console.log("Current account => " + this.accountService.currentAccount)
      console.log("Current house => " + this.accountService.houseCurrentAccount)
    }
  }
}
