import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { DefaultFilter } from './default-filter';

@Component({
  selector: 'checkbox-filter',
  template: `
    <input type="checkbox" [formControl]="inputControl" [ngClass]="inputClass" class="form-control" />
    <a href="#" *ngIf="filterActive" (click)="resetFilter($event)">
      {{ column.getFilterConfig()?.resetText || 'reset' }}
    </a>
  `,
})
export class CheckboxFilterComponent extends DefaultFilter implements OnInit, OnDestroy {
  filterActive: boolean = false;
  inputControl = new UntypedFormControl();
  constructor() {
    super();
  }

  ngOnInit() {
    this.inputControl.valueChanges
      .pipe(debounceTime(this.delay), takeUntil(this.destroy$))
      .subscribe((checked: boolean) => {
        this.filterActive = true;
        const trueVal = (this.column.getFilterConfig() && this.column.getFilterConfig().true) || true;
        const falseVal = (this.column.getFilterConfig() && this.column.getFilterConfig().false) || false;
        this.query = checked ? trueVal : falseVal;
        this.setFilter();
      });
  }

  resetFilter(event: any) {
    event.preventDefault();
    this.query = '';
    this.inputControl.setValue(false, { emitEvent: false });
    this.filterActive = false;
    this.setFilter();
  }
}
