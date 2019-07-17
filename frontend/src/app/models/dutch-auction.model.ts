export class DutchAuction {
  itemName: string;
  seller: string;
  reservePrice: number;
  initialPrice: number;
  lastForBlocks: number;
  strategy: string;
  isClosed: boolean;
  currentPrice: number;
  isOver: boolean;
  owner: string;
  auctionType: string;

  constructor(item?: Partial<DutchAuction>) {
    if (item)
      Object.assign(this, item);
  }
}