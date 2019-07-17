import { Component, Inject, ChangeDetectorRef, NgZone } from '@angular/core';
import Web3 from 'web3';
import { WEB3 } from './services/tokens';
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
    @Inject(WEB3) private web3: Web3,
    private accountService: AccountService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.init();

    this._window.ethereum.on('accountsChanged', accounts => {
      this.accountService.currentAccount = accounts[0];
      this.changeDetector.detectChanges();
      this.ngZone.run(() => {
        this.snackBar.open("The account has been changed", "Ok", { duration: 5000 });
      });
    })
  }




  async init() {
    const accounts = await this._window.ethereum.enable();
    this.accountService.currentAccount = accounts[0];
  }
}
