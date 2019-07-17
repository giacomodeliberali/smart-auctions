
import { InjectionToken } from '@angular/core';
import Web3 from 'web3';


export const WEB3 = new InjectionToken<Web3>('web3Token', {
    providedIn: 'root',
    factory: () => {
        try {
            //return new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
            const _w = window as any;

            if (_w.ethereum)
                return new Web3(_w.ethereum);


            return new Web3(_w.web3.currentProvider);
        } catch (err) {
            throw new Error('Unable to retrieve the injected Ethereum provider from MetaMask');
        }
    }
});