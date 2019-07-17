import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  public currentAccount: string;
  public houseCurrentAccount: string;
}
