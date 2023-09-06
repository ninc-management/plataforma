import { Directive, Injectable, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

import { moneyToNumber } from '../string-utils';

@Directive({
  selector: '[lastPayment]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: LastPaymentDirective,
      multi: true,
    },
  ],
})
@Injectable({
  providedIn: 'root',
})
export class LastPaymentDirective implements Validator {
  @Input('lastPayment') lastPaymentMoney = '';

  validate(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value || this.lastPaymentMoney.length == 0) return null;
    const forbidden = moneyToNumber(control.value) !== moneyToNumber(this.lastPaymentMoney);
    return forbidden ? { lastpayment: { value: control.value } } : null;
  }
}
