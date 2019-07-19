import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortifyAddress'
})
export class ShortifyAddressPipe implements PipeTransform {

  transform(address: string, ...args: any[]): any {
    if (!address)
      return "";
      
    return address.substr(0, 6) + '...' + address.substr(address.length - 4, address.length - 1);
  }

}
