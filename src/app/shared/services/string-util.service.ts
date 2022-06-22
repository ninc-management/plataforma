import { Injectable } from '@angular/core';

import { BrMaskDirective } from '../directives/br-mask.directive';

@Injectable({
  providedIn: 'root',
})
export class StringUtilService {
  constructor(private brMask: BrMaskDirective) {}

  sumMoney(value1: string, value2: string, decimals = 2): string {
    return this.numberToMoney(this.moneyToNumber(value1) + this.moneyToNumber(value2), decimals);
  }

  subtractMoney(value1: string, value2: string, decimals = 2): string {
    return this.numberToMoney(this.moneyToNumber(value1) - this.moneyToNumber(value2), decimals);
  }

  applyPercentage(value: string, percentage: string): string {
    return this.numberToMoney(this.moneyToNumber(value) * this.toMultiplyPercentage(percentage));
  }

  removePercentage(value: string, percentage: string): string {
    return this.numberToMoney(this.moneyToNumber(value) * (1 - this.toMultiplyPercentage(percentage)));
  }

  revertPercentage(value: string, percentage: string): string {
    if (!value || value.length == 0) return '0,00';
    return this.numberToMoney(this.moneyToNumber(value) / (1 - this.toMultiplyPercentage(percentage)));
  }

  moneyToNumber(money: string | undefined): number {
    if (money === undefined || money === '') return 0;
    const result = money.replace(/\./g, '').replace(',', '.');
    return +result;
  }

  numberToString(number: number, decimals = 4): string {
    return number.toFixed(decimals).toString().replace('.', ',');
  }

  numberToMoney(value: number, decimals = 2): string {
    const result = this.brMask.writeValueMoney(value.toFixed(decimals).toString(), {
      money: true,
      thousand: '.',
      decimalCaracter: ',',
      decimal: decimals,
      moneyInitHasInt: false,
    });
    return value < 0 ? '-' + result : result;
  }

  round(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  toMultiplyPercentage(percentage: string | undefined): number {
    if (!percentage || percentage.length == 0) return 0;
    return this.moneyToNumber(percentage) / 100;
  }

  toPercentage(value: string | undefined, base: string | undefined, decimals = 2): string {
    if (value == undefined || base == undefined || +base === 0 || value === '0,00' || base === '0,00') return '0,00%';
    return this.numberToMoney((this.moneyToNumber(value) / this.moneyToNumber(base)) * 100, decimals) + '%';
  }

  toPercentageNumber(value: number | undefined, base: number | undefined): string {
    if (base == undefined || base === 0 || value == undefined) return '0,00%';
    return this.numberToMoney((value / base) * 100) + '%';
  }

  toValue(percentage: string, base: string): string {
    return this.numberToMoney((this.moneyToNumber(percentage) / 100) * this.moneyToNumber(base));
  }

  applyBoldToMention(body: string): string {
    const regex = new RegExp(/(\*@).+?\*/g);
    return body.replace(regex, (match) => {
      return '<b>' + match.slice(1, -1) + ' </b>';
    });
  }
}
