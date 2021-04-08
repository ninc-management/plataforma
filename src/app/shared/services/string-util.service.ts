import { Injectable } from '@angular/core';
import { BrMaskDirective } from '../directives/br-mask.directive';

@Injectable({
  providedIn: 'root',
})
export class StringUtilService {
  constructor(private brMask: BrMaskDirective) {}

  sumMoney(value1: string, value2: string): string {
    return this.numberToMoney(
      this.moneyToNumber(value1) + this.moneyToNumber(value2)
    );
  }

  moneyToNumber(money: string): number {
    if (!money) return 0;
    const result = money.replace('.', '').replace(',', '.');
    return +result;
  }

  numberToNumber(money: string): number {
    const result = money.replace(',', '.');
    return +result;
  }

  numberToString(number: number): string {
    return number.toFixed(4).toString().replace('.', ',');
  }

  numberToMoney(value: number): string {
    const result = this.brMask.writeValueMoney(
      value.toFixed(2).toString().replace('.', ','),
      {
        money: true,
        thousand: '.',
        decimalCaracter: ',',
        decimal: 2,
      }
    );
    return value < 0 ? '-' + result : result;
  }

  round(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  toMutiplyPercentage(percentage: string): number {
    return (100 - this.numberToNumber(percentage)) / 100;
  }

  toPercentage(value: string, base: string): string {
    if (
      +base === 0 ||
      value === '0,00' ||
      base === '0,00' ||
      value == undefined ||
      base == undefined
    )
      return '0,00%';
    return (
      this.numberToMoney(
        (this.moneyToNumber(value) / this.moneyToNumber(base)) * 100
      ) + '%'
    );
  }

  toPercentageNumber(value: number, base: number): string {
    if (+base === 0 || value == undefined || base == undefined) return '0,00%';
    return this.numberToMoney((value / base) * 100) + '%';
  }

  toValue(percentage: string, base: string): string {
    return this.numberToMoney(
      (this.moneyToNumber(percentage) / 100) * this.moneyToNumber(base)
    );
  }
}
