export interface Auction {
  name: string;
  type: string;
  address: string;
}


export interface DutchAuctionBid {
  value: number;
}

export interface VickeryAuctionBid {
  hash: string;
  nonce: string;
  value: string;
}