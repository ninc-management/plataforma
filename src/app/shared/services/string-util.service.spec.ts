import { TestBed } from '@angular/core/testing';

import { StringUtilService } from './string-util.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('StringUtilService', () => {
  let service: StringUtilService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(StringUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sumMoney shoud work', () => {
    expect(service.sumMoney('', '')).toBe('0,00');
    expect(service.sumMoney('1', '')).toBe('1,00');
    expect(service.sumMoney('', '1')).toBe('1,00');
    expect(service.sumMoney('0', '0,00')).toBe('0,00');
    expect(service.sumMoney('1', '-1')).toBe('0,00');
    expect(service.sumMoney('1', '-2')).toBe('-1,00');
    expect(service.sumMoney('1', '2')).toBe('3,00');
    expect(service.sumMoney('1,2501', '2')).toBe('3,25');
    expect(service.sumMoney('1', '2,333', 3)).toBe('3,333');
    expect(service.sumMoney('1,00', '2,00')).toBe('3,00');
    expect(service.sumMoney('1.000,00', '2.000,00')).toBe('3.000,00');
    expect(service.sumMoney('1.000.000,00', '2.000.000,00')).toBe('3.000.000,00');
  });

  it('subtractMoney shoud work', () => {
    expect(service.subtractMoney('', '')).toBe('0,00');
    expect(service.subtractMoney('1', '')).toBe('1,00');
    expect(service.subtractMoney('', '1')).toBe('-1,00');
    expect(service.subtractMoney('0', '0,00')).toBe('0,00');
    expect(service.subtractMoney('1', '-1')).toBe('2,00');
    expect(service.subtractMoney('1', '-2')).toBe('3,00');
    expect(service.subtractMoney('1', '2')).toBe('-1,00');
    expect(service.subtractMoney('1,2501', '2')).toBe('-0,75');
    expect(service.subtractMoney('1', '2,333', 3)).toBe('-1,333');
    expect(service.subtractMoney('1,00', '2,00')).toBe('-1,00');
    expect(service.subtractMoney('1.000,00', '2.000,00')).toBe('-1.000,00');
    expect(service.subtractMoney('1.000.000,00', '2.000.000,00')).toBe('-1.000.000,00');
  });

  it('applyPercentage shoud work', () => {
    expect(service.applyPercentage('', '')).toBe('0,00');
    expect(service.applyPercentage('100', '')).toBe('0,00');
    expect(service.applyPercentage('', '100')).toBe('0,00');
    expect(service.applyPercentage('0', '0,00')).toBe('0,00');
    expect(service.applyPercentage('100', '10')).toBe('10,00');
    expect(service.applyPercentage('100,00', '200,00')).toBe('200,00');
    expect(service.applyPercentage('1.000,00', '100,00')).toBe('1.000,00');
    expect(service.applyPercentage('1.000.000,00', '100,00')).toBe('1.000.000,00');
  });

  it('removePercentage shoud work', () => {
    expect(service.removePercentage('', '')).toBe('0,00');
    expect(service.removePercentage('100', '')).toBe('100,00');
    expect(service.removePercentage('', '100')).toBe('0,00');
    expect(service.removePercentage('0', '0,00')).toBe('0,00');
    expect(service.removePercentage('100', '10')).toBe('90,00');
    expect(service.removePercentage('100,00', '200,00')).toBe('-100,00');
    expect(service.removePercentage('1.000,00', '100,00')).toBe('0,00');
    expect(service.removePercentage('1.000.000,00', '100,00')).toBe('0,00');
  });

  it('revertPercentage shoud work', () => {
    expect(service.revertPercentage('', '')).toBe('0,00');
    expect(service.revertPercentage('100', '')).toBe('100,00');
    expect(service.revertPercentage('', '100')).toBe('0,00');
    expect(service.revertPercentage('0', '0,00')).toBe('0,00');
    expect(service.revertPercentage('80', '20')).toBe('100,00');
    expect(service.revertPercentage('100,00', '200,00')).toBe('-100,00');
    expect(service.revertPercentage('1.000,00', '50,00')).toBe('2.000,00');
    expect(service.revertPercentage('1.000.000,00', '50,00')).toBe('2.000.000,00');
  });

  it('moneyToNumber shoud work', () => {
    expect(service.moneyToNumber(undefined)).toBe(0.0);
    expect(service.moneyToNumber('')).toBe(0.0);
    expect(service.moneyToNumber('100,00')).toBe(100.0);
    expect(service.moneyToNumber('-100,00')).toBe(-100.0);
    expect(service.moneyToNumber('0,00')).toBe(0.0);
    expect(service.moneyToNumber('1.000,00')).toBe(1000.0);
    expect(service.moneyToNumber('1.000.000,00')).toBe(1000000.0);
  });

  it('numberToString shoud work', () => {
    expect(service.numberToString(100.0)).toBe('100,0000');
    expect(service.numberToString(-100.0)).toBe('-100,0000');
    expect(service.numberToString(0.0)).toBe('0,0000');
    expect(service.numberToString(1000.0)).toBe('1000,0000');
    expect(service.numberToString(1000.0, 2)).toBe('1000,00');
    expect(service.numberToString(1000000.0)).toBe('1000000,0000');
  });

  it('round shoud work', () => {
    expect(service.round(100.999)).toBe(101.0);
    expect(service.round(0.0)).toBe(0.0);
    expect(service.round(1001.995)).toBe(1002.0);
    expect(service.round(1001.4449)).toBe(1001.44);
    expect(service.round(1001.5551)).toBe(1001.56);
    expect(service.round(350000.555)).toBe(350000.56);
    expect(service.round(-350000.555)).toBe(-350000.55);
    expect(service.round(-1001.5551)).toBe(-1001.56);
    expect(service.round(-1001.4449)).toBe(-1001.44);
  });

  it('toMultiplyPercentage shoud work', () => {
    expect(service.toMultiplyPercentage(undefined)).toBe(0.0);
    expect(service.toMultiplyPercentage('')).toBe(0.0);
    expect(service.toMultiplyPercentage('0,00')).toBe(0.0);
    expect(service.toMultiplyPercentage('50,00')).toBe(0.5);
    expect(service.toMultiplyPercentage('-100,00')).toBe(-1.0);
    expect(service.toMultiplyPercentage('100,00')).toBe(1.0);
    expect(service.toMultiplyPercentage('200,00')).toBe(2.0);
  });

  it('toPercentage shoud work', () => {
    expect(service.toPercentage(undefined, undefined)).toBe('0,00%');
    expect(service.toPercentage(undefined, '')).toBe('0,00%');
    expect(service.toPercentage('', undefined)).toBe('0,00%');
    expect(service.toPercentage('', '')).toBe('0,00%');
    expect(service.toPercentage('10,00', '100,00')).toBe('10,00%');
    expect(service.toPercentage('200,00', '100,00')).toBe('200,00%');
    expect(service.toPercentage('-200,00', '100,00')).toBe('-200,00%');
    expect(service.toPercentage('50,00', '100,00', 4)).toBe('50,0000%');
  });

  it('toPercentageNumber shoud work', () => {
    expect(service.toPercentageNumber(undefined, undefined)).toBe('0,00%');
    expect(service.toPercentageNumber(undefined, 5)).toBe('0,00%');
    expect(service.toPercentageNumber(5, undefined)).toBe('0,00%');
    expect(service.toPercentageNumber(10.0, 100.0)).toBe('10,00%');
    expect(service.toPercentageNumber(200.0, 100.0)).toBe('200,00%');
    expect(service.toPercentageNumber(-200.0, 100.0)).toBe('-200,00%');
  });

  it('toValue shoud work', () => {
    expect(service.toValue('', '')).toBe('0,00');
    expect(service.toValue('', '5')).toBe('0,00');
    expect(service.toValue('5', '')).toBe('0,00');
    expect(service.toValue('10,0', '100,0')).toBe('10,00');
    expect(service.toValue('200,0', '100,0')).toBe('200,00');
    expect(service.toValue('-200,0', '100,0')).toBe('-200,00');
  });
});
