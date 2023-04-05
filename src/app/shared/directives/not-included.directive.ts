import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[notIncluded]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: NotIncludedDirective,
      multi: true,
    },
  ],
})
export class NotIncludedDirective<T extends object> implements Validator {
  @Input('notIncluded') predicate?: (fieldValue: string) => T[];

  constructor() {}

  validate(control: AbstractControl): { [key: string]: any } | null {
    const valueItem = control.value;
    let conflictedObjects: T[] = [];
    if (this.predicate) conflictedObjects = this.predicate(valueItem);
    return conflictedObjects.length > 0 ? { included: conflictedObjects } : null;
  }
}
