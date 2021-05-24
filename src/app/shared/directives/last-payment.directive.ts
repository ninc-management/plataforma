import { Directive, Input, Injectable } from '@angular/core';
import { NG_VALIDATORS, AbstractControl, Validator } from '@angular/forms';
import { StringUtilService } from '../services/string-util.service';

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

  constructor(private stringUtilService: StringUtilService) {}

  validate(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value || this.lastPaymentMoney.length == 0) return null;
    const forbidden =
      this.stringUtilService.moneyToNumber(control.value) !==
      this.stringUtilService.moneyToNumber(this.lastPaymentMoney);
    return forbidden ? { lastpayment: { value: control.value } } : null;
  }
}
