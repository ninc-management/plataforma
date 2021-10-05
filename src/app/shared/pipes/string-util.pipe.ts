import { Pipe, PipeTransform } from '@angular/core';
import { BrMaskDirective } from '../directives/br-mask.directive';

@Pipe({
  name: 'numberToMoney'
})
export class NumberToMoneyPipe implements PipeTransform {

  constructor(private brMask: BrMaskDirective){}

  transform(value: number, decimals = 2): string {
    const result = this.brMask.writeValueMoney(value.toFixed(decimals).toString(), {
      money: true,
      thousand: '.',
      decimalCaracter: ',',
      decimal: decimals,
    });
    return value < 0 ? '-' + result : result;
  }
}