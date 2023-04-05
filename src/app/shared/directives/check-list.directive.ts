import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[checkList]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: CheckListDirective,
      multi: true,
    },
  ],
})
export class CheckListDirective implements Validator {
  @Input('checkList') list?: any[];

  constructor() {}

  validate(control: AbstractControl): { [key: string]: any } | null {
    const valueItem = control.value;
    const item = this.list?.find((item) => item.document === valueItem);
    return item ? { item: item.document, itemExistente: true } : null;
  }
}
