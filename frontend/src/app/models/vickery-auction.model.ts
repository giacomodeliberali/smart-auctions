export enum PhaseType {
  Commitment,
  Withdrawal,
  Opening,
  Closed,
  Finalized
}

export class VickeryAuction {
  address: string;
  itemName: string;
  seller: string;
  owner: string;
  state: PhaseType;
  winner: string;
  winnerPrice: string;

  commitmentPhaseLength: string;
  withdrawalPhaseLength: string;
  bidPhaseLength: string;
  deposit: string;

  constructor(item?: Partial<VickeryAuction>) {
    if (item)
      Object.assign(this, item);
  }
}