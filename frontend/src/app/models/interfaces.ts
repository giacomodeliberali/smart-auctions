export interface Auction {
  name: string;
  type: string;
  address: string;
}


export interface DutchAuctionBid {
  from: string;
  value: number;
}