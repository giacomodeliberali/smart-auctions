import { Component, Inject } from '@angular/core';
import Web3 from 'web3';
import { WEB3 } from './services/tokens';
import TruffleContract from 'truffle-contract';

//import LinearStrategyAbi from '../../../build/contracts/LinearStrategy.json';
import LinearStrategyAbi from './LinearStrategy.json';
import DutchAuctionAbi from '../../../build/contracts/DutchAuction.json';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'frontend';

  constructor(@Inject(WEB3) private web3: Web3) {




    this.web3.eth.defaultAccount = web3.eth.accounts[0];

  }

  ngOnInit() {
    this.init();
  }




  async init() {

      console.log(LinearStrategyAbi.contractName);

      const linearStrategy = TruffleContract(LinearStrategyAbi);
      linearStrategy.setProvider(this.web3.currentProvider);


      const instance = linearStrategy.deployed();


    //const dutch = TruffleContract(DutchAuctionAbi).new();


  }
}
