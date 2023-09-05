import { BrMaskDirective } from './directives/br-mask.directive';

let brMask: BrMaskDirective;

export function sumMoney(value1: string, value2: string, decimals = 2): string {
  return numberToMoney(moneyToNumber(value1) + moneyToNumber(value2), decimals);
}

export function subtractMoney(value1: string, value2: string, decimals = 2): string {
  return numberToMoney(moneyToNumber(value1) - moneyToNumber(value2), decimals);
}

export function applyPercentage(value: string, percentage: string): string {
  return numberToMoney(moneyToNumber(value) * toMultiplyPercentage(percentage));
}

export function removePercentage(value: string, percentage: string): string {
  return numberToMoney(moneyToNumber(value) * (1 - toMultiplyPercentage(percentage)));
}

export function revertPercentage(value: string, percentage: string): string {
  if (!value || value.length == 0) return '0,00';
  return numberToMoney(moneyToNumber(value) / (1 - toMultiplyPercentage(percentage)));
}

export function moneyToNumber(money: string | undefined): number {
  if (money === undefined || money === '') return 0;
  const result = money.replace(/\./g, '').replace(',', '.');
  return +result;
}

export function numberToString(number: number, decimals = 4): string {
  return number.toFixed(decimals).toString().replace('.', ',');
}

export function numberToMoney(value: number, decimals = 2): string {
  const result = brMask.writeValueMoney(value.toFixed(decimals).toString(), {
    money: true,
    thousand: '.',
    decimalCaracter: ',',
    decimal: decimals,
    moneyInitHasInt: false,
  });
  return value < 0 ? '-' + result : result;
}

export function round(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function toMultiplyPercentage(percentage: string | undefined): number {
  if (!percentage || percentage.length == 0) return 0;
  return moneyToNumber(percentage) / 100;
}

export function toPercentage(value: string | undefined, base: string | undefined, decimals = 2): string {
  if (value == undefined || base == undefined || +base === 0 || value === '0,00' || base === '0,00') return '0,00%';
  return numberToMoney((moneyToNumber(value) / moneyToNumber(base)) * 100, decimals) + '%';
}

export function toPercentageNumber(value: number | undefined, base: number | undefined): string {
  if (base == undefined || base === 0 || value == undefined) return '0,00%';
  return numberToMoney((value / base) * 100) + '%';
}

export function toValue(percentage: string, base: string): string {
  return numberToMoney((moneyToNumber(percentage) / 100) * moneyToNumber(base));
}

export function applyBoldToMention(body: string): string {
  const regex = new RegExp(/(\*@).+?\*/g);
  return body.replace(regex, (match) => {
    return '<b>' + match.slice(1, -1) + ' </b>';
  });
}
