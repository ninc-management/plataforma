import { Component, OnInit } from '@angular/core';

import { DefaultFilter } from './default-filter';

@Component({
  selector: 'select-filter',
  template: `
    <nb-select
      [ngClass]="inputClass"
      class="form-control"
      [(ngModel)]="selected"
      (ngModelChange)="changeQuery()"
      [multiple]="column.getFilterConfig().multiple"
    >
      <nb-option value="">{{ column.getFilterConfig().selectText }}</nb-option>
      <nb-option *ngFor="let option of column.getFilterConfig().list" [value]="option.value">
        {{ option.title }}
      </nb-option>
    </nb-select>
  `,
  styleUrls: ['./select-filter.component.scss'],
})
export class SelectFilterComponent extends DefaultFilter implements OnInit {
  selected!: string[] | string;
  constructor() {
    super();
  }

  changeQuery() {
    this.query = this.selected instanceof Array ? this.selected.join(' ') : this.selected;
    this.setFilter();
  }

  ngOnInit() {
    this.selected = this.query
      ? this.query.replace(/ ([A-Z])/g, '|$1').split('|')
      : this.column.getFilterConfig().multiple
      ? []
      : '';
    if (this.selected instanceof Array && !this.column.getFilterConfig().multiple) this.selected = this.query;
    this.setFilter();
  }
}
