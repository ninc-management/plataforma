import { TestBed } from '@angular/core/testing';
import { FormatDatePipe } from './utils.pipe';

describe('FormatDatePipe', () => {
  let formatDatePipe: FormatDatePipe;

  beforeEach(() => {
    formatDatePipe = new FormatDatePipe();
  });

  it('create formatDatePipe instance', () => {
    const pipe = new FormatDatePipe();
    expect(pipe).toBeTruthy();
  });

  it('formatDate should work', () => {
    const date = new Date('Jun 17, 2021');
    const pipe = new FormatDatePipe();
    expect(pipe.transform(date)).toBe('17/06/2021');
    expect(pipe.transform(date, '-')).toBe('17-06-2021');
  });

});
