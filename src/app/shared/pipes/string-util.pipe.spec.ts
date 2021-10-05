import { inject } from '@angular/core/testing';
import { BrMaskDirective } from '../directives/br-mask.directive';
import { NumberToMoneyPipe } from './string-util.pipe';

describe('StringUtilPipes', inject([BrMaskDirective], (brMask: BrMaskDirective) => {
  it('create an numberToMoneyPipe instance', () => {
    const pipe = new NumberToMoneyPipe(brMask);
    expect(pipe).toBeTruthy();
  });

  it('numberToMoneyPipe shoud work', () => {
    const pipe = new NumberToMoneyPipe(brMask);
    expect(pipe.transform(100.0)).toBe('100,00');
    expect(pipe.transform(0.0)).toBe('0,00');
    expect(pipe.transform(1000.0)).toBe('1.000,00');
    expect(pipe.transform(1000.0, 4)).toBe('1.000,0000');
    expect(pipe.transform(-1000.0)).toBe('-1.000,00');
    expect(pipe.transform(350000.0)).toBe('350.000,00');
    expect(pipe.transform(1000000.0)).toBe('1.000.000,00');
  });
}));
