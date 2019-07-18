export enum PhaseType {
  Commitment,
  Withdrawal,
  Opening,
  Closed
}

export class VickeryAuction {
  address: string;
  itemName: string;
  seller: string;
  owner: string;
  state: PhaseType;

  commitmentPhaseLength: string;
  withdrawalPhaseLength: string;
  bidPhaseLength: string;
  deposit: string;

  constructor(item?: Partial<VickeryAuction>) {
    if (item)
      Object.assign(this, item);
  }
}