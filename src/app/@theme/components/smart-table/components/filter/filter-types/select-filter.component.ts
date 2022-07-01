import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { NgControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';

import { DefaultFilter } from './default-filter';

@Component({
  selector: 'select-filter',
  template: `
    <select [ngClass]="inputClass" class="form-control" #inputControl [(ngModel)]="query">
      <option value="">{{ column.getFilterConfig().selectText }}</option>
      <option *ngFor="let option of column.getFilterConfig().list" [value]="option.value">
        {{ option.title }}
      </option>
    </select>
  `,
})
export class SelectFilterComponent extends DefaultFilter implements AfterViewInit {
  @ViewChild('inputControl', { read: NgControl, static: true }) inputControl!: NgControl;

  constructor() {
    super();
  }

  ngAfterViewInit() {
    if (this.inputControl.valueChanges != null)
      this.inputControl.valueChanges
        .pipe(skip(1), distinctUntilChanged(), debounceTime(this.delay))
        .subscribe((value: string) => this.setFilter());
  }
}
