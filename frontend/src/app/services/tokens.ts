
import { InjectionToken, inject } from '@angular/core';
import { ethers } from 'ethers';
import AuctionsHouseJson from '../../../../build/contracts/AuctionsHouse.json';
import DutchAuctionJson from '../../../../build/contracts/DutchAuction.json';
import LinearStrategyJson from '../../../../build/contracts/LinearStrategy.json';
import VickeryAuctionJson from '../../../../build/contracts/VickeryAuction.json';
import AbstractAuctionJson from '../../../../build/contracts/AbstractAuction.json';

export const RpcProvider = new InjectionToken<ethers.providers.Web3Provider>('web3Token', {
    providedIn: 'root',
    factory: () => {
        try {
            const _w = window as any;
            return new ethers.providers.Web3Provider(_w.web3.currentProvider);

        } catch (err) {
            console.error('Unable to retrieve the injected Ethereum provider from MetaMask');
            return null;
        }
    }
});



export const AuctionHouseFactory = new InjectionToken<ethers.ContractFactory>('AuctionHouseFactory', {
    providedIn: 'root',
    factory: () => {

        const provider = inject(RpcProvider);

        if (!provider)
            return null;

        return new ethers.ContractFactory(AuctionsHouseJson.abi, AuctionsHouseJson.bytecode, provider.getSigner());
    }
});

export const DutchAuctionFactory = new InjectionToken<ethers.ContractFactory>('DutchAuctionFactory', {
    providedIn: 'root',
    factory: () => {

        const provider = inject(RpcProvider);

        if (!provider)
            return null;

        return new ethers.ContractFactory(DutchAuctionJson.abi, DutchAuctionJson.bytecode, provider.getSigner());
    }
});


export const LinearStrategyFactory = new InjectionToken<ethers.ContractFactory>('LinearStrategyFactory', {
    providedIn: 'root',
    factory: () => {

        const provider = inject(RpcProvider);

        if (!provider)
            return null;

        return new ethers.ContractFactory(LinearStrategyJson.abi, LinearStrategyJson.bytecode, provider.getSigner());
    }
});


export const VickeryAuctionFactory = new InjectionToken<ethers.ContractFactory>('VickeryAuctionFactory', {
    providedIn: 'root',
    factory: () => {

        const provider = inject(RpcProvider);

        if (!provider)
            return null;

        return new ethers.ContractFactory(VickeryAuctionJson.abi, VickeryAuctionJson.bytecode, provider.getSigner());
    }
});

export const AbstractAuctionFactory = new InjectionToken<ethers.ContractFactory>('AbstractAuctionFactory', {
    providedIn: 'root',
    factory: () => {

        const provider = inject(RpcProvider);

        if (!provider)
            return null;

        return new ethers.ContractFactory(AbstractAuctionJson.abi, AbstractAuctionJson.bytecode, provider.getSigner());
    }
});