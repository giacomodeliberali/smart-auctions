import { Component, OnInit } from '@angular/core';
import { DutchAuction } from '../models/dutch-auction.model';
import { ActivatedRoute } from '@angular/router';
import { ContractsService } from '../services/contracts.service';
import DutchAuctionJson from '../../../../build/contracts/DutchAuction.json';
import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-dutch-detail',
  templateUrl: './dutch-detail.component.html',
  styleUrls: ['./dutch-detail.component.scss']
})
export class DutchDetailComponent implements OnInit {

  private dutch: DutchAuction;

  private bid: {
    from: string,
    value: number
  };

  constructor(private route: ActivatedRoute,
    private accountService: AccountService,
    private contractService: ContractsService) {

  }


  async ngOnInit() {
    const address = this.route.snapshot.paramMap.get("address");
    const contract = this.contractService.getContractAtAddress(DutchAuctionJson.abi, address);

    const dutch = new DutchAuction({
      isClosed: await contract.methods.isClosed.call(),
      isOver: await contract.methods.isOver.call(),
      currentPrice: (await contract.methods.getCurrentPrice.call()).toNumber(),
      itemName: await contract.methods.itemName.call(),
      seller: await contract.methods.seller.call(),
      owner: await contract.methods.owner.call()
    });

    this.dutch = dutch;

    this.bid = {
      from: this.accountService.currentAccount,
      value: 100
    }

  }

}
