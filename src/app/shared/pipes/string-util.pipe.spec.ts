import { inject } from '@angular/core/testing';
import { BrMaskDirective } from '../directives/br-mask.directive';
import { NumberToMoneyPipe } from './string-util.pipe';

describe('StringUtilPipes', inject([BrMaskDirective], (brMask: BrMaskDirective) => {
  let numberToMoneyPipe: NumberToMoneyPipe;

  beforeEach(() => {
    numberToMoneyPipe = new NumberToMoneyPipe(brMask);
  });

  it('create an numberToMoneyPipe instance', () => {
    expect(numberToMoneyPipe).toBeTruthy();
  });

  it('numberToMoneyPipe shoud work', () => {
    expect(numberToMoneyPipe.transform(100.0)).toBe('100,00');
    expect(numberToMoneyPipe.transform(0.0)).toBe('0,00');
    expect(numberToMoneyPipe.transform(1000.0)).toBe('1.000,00');
    expect(numberToMoneyPipe.transform(1000.0, 4)).toBe('1.000,0000');
    expect(numberToMoneyPipe.transform(-1000.0)).toBe('-1.000,00');
    expect(numberToMoneyPipe.transform(350000.0)).toBe('350.000,00');
    expect(numberToMoneyPipe.transform(1000000.0)).toBe('1.000.000,00');
  });
}));
