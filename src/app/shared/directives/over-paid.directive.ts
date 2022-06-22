import { Directive, Injectable, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

import { StringUtilService } from '../services/string-util.service';

@Directive({
  selector: '[overPaid]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: OverPaidDirective,
      multi: true,
    },
  ],
})
@Injectable({
  providedIn: 'root',
})
export class OverPaidDirective implements Validator {
  @Input('overPaid') maxMoney = '0,00';

  constructor(private stringUtilService: StringUtilService) {}

  validate(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const forbidden =
      this.stringUtilService.moneyToNumber(control.value) > this.stringUtilService.moneyToNumber(this.maxMoney);
    return forbidden ? { overpaid: { value: control.value } } : null;
  }
}
