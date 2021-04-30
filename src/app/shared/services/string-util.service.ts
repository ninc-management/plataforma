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

  applyPercentage(value: string, percentage: string): string {
    return this.numberToMoney(
      this.moneyToNumber(value) * this.toMutiplyPercentage(percentage)
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

  numberToString(number: number, decimals = 4): string {
    return number.toFixed(decimals).toString().replace('.', ',');
  }

  numberToMoney(value: number, decimals = 2): string {
    const result = this.brMask.writeValueMoney(
      value.toFixed(decimals).toString().replace('.', ','),
      {
        money: true,
        thousand: '.',
        decimalCaracter: ',',
        decimal: decimals,
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

  toPercentage(value: string, base: string, decimals = 2): string {
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
        (this.moneyToNumber(value) / this.moneyToNumber(base)) * 100,
        decimals
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
