import { Component, Inject } from '@angular/core';
import Web3 from 'web3';
import { WEB3 } from './services/tokens';
import TruffleContract from 'truffle-contract';

import LinearStrategyJson from '../../../build/contracts/LinearStrategy.json';
//import LinearStrategyAbi from './LinearStrategy.json';
import DutchAuctionAbi from '../../../build/contracts/DutchAuction.json';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  private _window: any = window;
  private currentAccount: string;

  constructor(@Inject(WEB3) private web3: Web3) {





  }

  ngOnInit() {
    this.init();

    this._window.ethereum.on('accountsChanged', accounts => {
      this.currentAccount = accounts[0];
      console.log("accountsChanged", accounts[0]);
    })
  }




  async init() {
    const accounts = await this._window.ethereum.enable();
    const currentAccount = accounts[0];

    const balance = await this.web3.eth.getBalance(currentAccount);


    console.log(currentAccount, balance);


    const LinearStrategy = new this.web3.eth.Contract(LinearStrategyJson.abi as any);

    const gas = await LinearStrategy.deploy({
      data: LinearStrategyJson.bytecode
    }).estimateGas();

    LinearStrategy.deploy({
      data: LinearStrategyJson.bytecode
    }).send({
      from: currentAccount,
      gas: gas
    })
      .on('error', console.error)
      .on('transactionHash', console.log)
      .on('receipt', console.log)
      .on('confirmation', console.log);




    //const dutch = TruffleContract(DutchAuctionAbi).new();


  }
}
