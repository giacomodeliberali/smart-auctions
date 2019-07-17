import Web3 from 'web3';
import { Contract, TransactionReceipt } from 'web3-eth-contract'
import { Inject, Injectable } from '@angular/core';
import { WEB3 } from './tokens';

@Injectable({
    providedIn: 'root'
})
export class ContractsService {

    constructor(@Inject(WEB3) private web3: Web3) {

    }

    public async deployContract(abi: any, bytecode: any, from: string, args: Array<any> = []): Promise<Contract> {

        const contract = new this.web3.eth.Contract(abi);

        const gas = await contract.deploy({
            data: bytecode
        }).estimateGas();

        return new Promise((resolve, reject) => {
            contract.deploy({
                data: bytecode,
                arguments: args
            })
                .send({
                    from: from,
                    gas: gas
                })
                .on('confirmation', async (confirmationNumber, receipt) => {
                    const contractAddress = receipt.contractAddress;
                    resolve(new this.web3.eth.Contract(abi, contractAddress));
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    public getContractAtAddress(abi: any, contractAddress: string) {
        return new this.web3.eth.Contract(abi, contractAddress);
    }

}