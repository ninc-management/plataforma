import { Injectable } from '@angular/core';
import { BrMaskDirective } from '../directives/br-mask.directive';

@Injectable({
  providedIn: 'root',
})
export class StringUtilService {
  constructor(private brMask: BrMaskDirective) {}

  moneyToNumber(money: string): number {
    const result = money.replace('.', '').replace(',', '.');
    return +result;
  }

  numberToNumber(money: string): number {
    const result = money.replace(',', '.');
    return +result;
  }

  numberToMoney(value: number): string {
    return this.brMask.writeValueMoney(
      value.toFixed(2).toString().replace('.', ','),
      {
        money: true,
        thousand: '.',
        decimalCaracter: ',',
        decimal: 2,
      }
    );
  }

  round(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  toMutiplyPercentage(percentage: string): number {
    return (100 - this.numberToNumber(percentage)) / 100;
  }
}
