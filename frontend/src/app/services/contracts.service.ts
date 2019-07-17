import Web3 from 'web3';
import { Contract, TransactionReceipt } from 'web3-eth-contract'
import { Inject, Injectable, NgZone } from '@angular/core';
import { WEB3 } from './tokens';

@Injectable({
    providedIn: 'root'
})
export class ContractsService {

    constructor(@Inject(WEB3) private web3: Web3,
        private ngZone: NgZone) {

    }

    public getContractAtAddress(abi: any, contractAddress: string) {
        return new this.web3.eth.Contract(abi, contractAddress);
    }

}