import { CommonTestingModule } from 'app/../common-testing.module';

import {
  applyPercentage,
  moneyToNumber,
  numberToMoney,
  numberToString,
  removePercentage,
  revertPercentage,
  round,
  subtractMoney,
  sumMoney,
  toMultiplyPercentage,
  toPercentage,
  toPercentageNumber,
  toValue,
} from './string-utils';

describe('StringUtilService', () => {
  CommonTestingModule.setUpTestBed();

  it('sumMoney shoud work', () => {
    expect(sumMoney('', '')).toBe('0,00');
    expect(sumMoney('1', '')).toBe('1,00');
    expect(sumMoney('', '1')).toBe('1,00');
    expect(sumMoney('0', '0,00')).toBe('0,00');
    expect(sumMoney('1', '-1')).toBe('0,00');
    expect(sumMoney('1', '-2')).toBe('-1,00');
    expect(sumMoney('1', '2')).toBe('3,00');
    expect(sumMoney('1,2501', '2')).toBe('3,25');
    expect(sumMoney('1', '2,333', 3)).toBe('3,333');
    expect(sumMoney('1,00', '2,00')).toBe('3,00');
    expect(sumMoney('1.000,00', '2.000,00')).toBe('3.000,00');
    expect(sumMoney('1.000.000,00', '2.000.000,00')).toBe('3.000.000,00');
  });

  it('subtractMoney shoud work', () => {
    expect(subtractMoney('', '')).toBe('0,00');
    expect(subtractMoney('1', '')).toBe('1,00');
    expect(subtractMoney('', '1')).toBe('-1,00');
    expect(subtractMoney('0', '0,00')).toBe('0,00');
    expect(subtractMoney('1', '-1')).toBe('2,00');
    expect(subtractMoney('1', '-2')).toBe('3,00');
    expect(subtractMoney('1', '2')).toBe('-1,00');
    expect(subtractMoney('1,2501', '2')).toBe('-0,75');
    expect(subtractMoney('1', '2,333', 3)).toBe('-1,333');
    expect(subtractMoney('1,00', '2,00')).toBe('-1,00');
    expect(subtractMoney('1.000,00', '2.000,00')).toBe('-1.000,00');
    expect(subtractMoney('1.000.000,00', '2.000.000,00')).toBe('-1.000.000,00');
  });

  it('applyPercentage shoud work', () => {
    expect(applyPercentage('', '')).toBe('0,00');
    expect(applyPercentage('100', '')).toBe('0,00');
    expect(applyPercentage('', '100')).toBe('0,00');
    expect(applyPercentage('0', '0,00')).toBe('0,00');
    expect(applyPercentage('100', '10')).toBe('10,00');
    expect(applyPercentage('100,00', '200,00')).toBe('200,00');
    expect(applyPercentage('1.000,00', '100,00')).toBe('1.000,00');
    expect(applyPercentage('1.000.000,00', '100,00')).toBe('1.000.000,00');
  });

  it('removePercentage shoud work', () => {
    expect(removePercentage('', '')).toBe('0,00');
    expect(removePercentage('100', '')).toBe('100,00');
    expect(removePercentage('', '100')).toBe('0,00');
    expect(removePercentage('0', '0,00')).toBe('0,00');
    expect(removePercentage('100', '10')).toBe('90,00');
    expect(removePercentage('100,00', '200,00')).toBe('-100,00');
    expect(removePercentage('1.000,00', '100,00')).toBe('0,00');
    expect(removePercentage('1.000.000,00', '100,00')).toBe('0,00');
  });

  it('revertPercentage shoud work', () => {
    expect(revertPercentage('', '')).toBe('0,00');
    expect(revertPercentage('100', '')).toBe('100,00');
    expect(revertPercentage('', '100')).toBe('0,00');
    expect(revertPercentage('0', '0,00')).toBe('0,00');
    expect(revertPercentage('80', '20')).toBe('100,00');
    expect(revertPercentage('100,00', '200,00')).toBe('-100,00');
    expect(revertPercentage('1.000,00', '50,00')).toBe('2.000,00');
    expect(revertPercentage('1.000.000,00', '50,00')).toBe('2.000.000,00');
  });

  it('moneyToNumber shoud work', () => {
    expect(moneyToNumber(undefined)).toBe(0.0);
    expect(moneyToNumber('')).toBe(0.0);
    expect(moneyToNumber('100,00')).toBe(100.0);
    expect(moneyToNumber('-100,00')).toBe(-100.0);
    expect(moneyToNumber('0,00')).toBe(0.0);
    expect(moneyToNumber('1.000,00')).toBe(1000.0);
    expect(moneyToNumber('1.000.000,00')).toBe(1000000.0);
  });

  it('numberToString shoud work', () => {
    expect(numberToString(100.0)).toBe('100,0000');
    expect(numberToString(-100.0)).toBe('-100,0000');
    expect(numberToString(0.0)).toBe('0,0000');
    expect(numberToString(1000.0)).toBe('1000,0000');
    expect(numberToString(1000.0, 2)).toBe('1000,00');
    expect(numberToString(1000000.0)).toBe('1000000,0000');
  });

  it('numberToMoney shoud work', () => {
    expect(numberToMoney(100.0)).toBe('100,00');
    expect(numberToMoney(0.0)).toBe('0,00');
    expect(numberToMoney(1000.0)).toBe('1.000,00');
    expect(numberToMoney(1000.0, 4)).toBe('1.000,0000');
    expect(numberToMoney(-1000.0)).toBe('-1.000,00');
    expect(numberToMoney(350000.0)).toBe('350.000,00');
    expect(numberToMoney(1000000.0)).toBe('1.000.000,00');
  });

  it('round shoud work', () => {
    expect(round(100.999)).toBe(101.0);
    expect(round(0.0)).toBe(0.0);
    expect(round(1001.995)).toBe(1002.0);
    expect(round(1001.4449)).toBe(1001.44);
    expect(round(1001.5551)).toBe(1001.56);
    expect(round(350000.555)).toBe(350000.56);
    expect(round(-350000.555)).toBe(-350000.55);
    expect(round(-1001.5551)).toBe(-1001.56);
    expect(round(-1001.4449)).toBe(-1001.44);
  });

  it('toMultiplyPercentage shoud work', () => {
    expect(toMultiplyPercentage(undefined)).toBe(0.0);
    expect(toMultiplyPercentage('')).toBe(0.0);
    expect(toMultiplyPercentage('0,00')).toBe(0.0);
    expect(toMultiplyPercentage('50,00')).toBe(0.5);
    expect(toMultiplyPercentage('-100,00')).toBe(-1.0);
    expect(toMultiplyPercentage('100,00')).toBe(1.0);
    expect(toMultiplyPercentage('200,00')).toBe(2.0);
  });

  it('toPercentage shoud work', () => {
    expect(toPercentage(undefined, undefined)).toBe('0,00%');
    expect(toPercentage(undefined, '')).toBe('0,00%');
    expect(toPercentage('', undefined)).toBe('0,00%');
    expect(toPercentage('', '')).toBe('0,00%');
    expect(toPercentage('10,00', '100,00')).toBe('10,00%');
    expect(toPercentage('200,00', '100,00')).toBe('200,00%');
    expect(toPercentage('-200,00', '100,00')).toBe('-200,00%');
    expect(toPercentage('50,00', '100,00', 4)).toBe('50,0000%');
  });

  it('toPercentageNumber shoud work', () => {
    expect(toPercentageNumber(undefined, undefined)).toBe('0,00%');
    expect(toPercentageNumber(undefined, 5)).toBe('0,00%');
    expect(toPercentageNumber(5, undefined)).toBe('0,00%');
    expect(toPercentageNumber(10.0, 100.0)).toBe('10,00%');
    expect(toPercentageNumber(200.0, 100.0)).toBe('200,00%');
    expect(toPercentageNumber(-200.0, 100.0)).toBe('-200,00%');
  });

  it('toValue shoud work', () => {
    expect(toValue('', '')).toBe('0,00');
    expect(toValue('', '5')).toBe('0,00');
    expect(toValue('5', '')).toBe('0,00');
    expect(toValue('10,0', '100,0')).toBe('10,00');
    expect(toValue('200,0', '100,0')).toBe('200,00');
    expect(toValue('-200,0', '100,0')).toBe('-200,00');
  });
});
