import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { isSameDay } from 'date-fns';
import { isEqual } from 'lodash';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { DefaultFilter } from './default-filter';
import { reviveDates } from 'app/shared/utils';

import { DateRange } from '@models/contract';

export function dateRangeFilter(cell: any, search?: string): boolean {
  if (search) {
    const range = reviveDates(JSON.parse(search));
    if (range.start) {
      if (range.end) return cell >= range.start && cell <= range.end;
      return isSameDay(cell, range.start);
    }
  }
  return false;
}

@Component({
  selector: 'date-filter',
  template: `
    <input
      [formControl]="inputControl"
      [nbDatepicker]="rangepicker"
      class="form-control"
      placeholder="{{ column.title }}"
    />
    <nb-rangepicker #rangepicker></nb-rangepicker>
  `,
})
export class DateFilterComponent extends DefaultFilter implements OnInit, OnChanges {
  inputControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.query) {
      this.inputControl.setValue(reviveDates(JSON.parse(this.query)) as DateRange);
    }
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(this.delay)).subscribe((value: string) => {
      this.query = JSON.stringify(this.inputControl.value);
      this.setFilter();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.query && changes.query && !isEqual(changes.query.previousValue, this.query)) {
      this.inputControl.setValue(reviveDates(JSON.parse(this.query)) as DateRange);
    }
  }
}
