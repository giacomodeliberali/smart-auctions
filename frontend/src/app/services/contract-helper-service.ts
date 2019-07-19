import { Injectable, Inject } from '@angular/core';
import { RpcProvider } from './tokens'
import { ethers } from 'ethers';

@Injectable({
    providedIn: 'root'
})
export class ContractHelperService {


    constructor(
        @Inject(RpcProvider)
        private provider: ethers.providers.Web3Provider) {

    }

    async getEstimateGasFor(transaction: ethers.providers.TransactionRequest) {
        let gasLimit = await this.provider.estimateGas(transaction);
        gasLimit = gasLimit.mul(4);
        return gasLimit
    }
}
