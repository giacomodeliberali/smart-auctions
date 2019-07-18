
import { InjectionToken, inject } from '@angular/core';
import { ethers } from 'ethers';
import AuctionsHouseJson from '../../../../build/contracts/AuctionsHouse.json';
import DutchAuctionJson from '../../../../build/contracts/DutchAuction.json';
import LinearStrategyJson from '../../../../build/contracts/LinearStrategy.json';

export const RpcProvider = new InjectionToken<ethers.providers.Web3Provider>('web3Token', {
    providedIn: 'root',
    factory: () => {
        try {
            const _w = window as any;
            return new ethers.providers.Web3Provider(_w.web3.currentProvider);

        } catch (err) {
            throw new Error('Unable to retrieve the injected Ethereum provider from MetaMask');
        }
    }
});



export const AuctionHouseFactory = new InjectionToken<ethers.ContractFactory>('web3Token', {
    providedIn: 'root',
    factory: () => {
        return new ethers.ContractFactory(AuctionsHouseJson.abi, AuctionsHouseJson.bytecode, inject(RpcProvider).getSigner());
    }
});

export const DutchAuctionFactory = new InjectionToken<ethers.ContractFactory>('web3Token', {
    providedIn: 'root',
    factory: () => {
        return new ethers.ContractFactory(DutchAuctionJson.abi, DutchAuctionJson.bytecode, inject(RpcProvider).getSigner()); }
});


export const LinearStrategyFactory = new InjectionToken<ethers.ContractFactory>('web3Token', {
    providedIn: 'root',
    factory: () => {
        return new ethers.ContractFactory(LinearStrategyJson.abi, LinearStrategyJson.bytecode, inject(RpcProvider).getSigner()); }
});