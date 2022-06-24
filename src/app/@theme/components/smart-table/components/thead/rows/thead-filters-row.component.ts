import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { Column } from '../../../lib/data-set/column';
import { DataSource } from '../../../lib/data-source/data-source';
import { Grid } from '../../../lib/grid';

@Component({
  selector: '[ng2-st-thead-filters-row]',
  template: `
    <th *ngIf="isMultiSelectVisible"></th>
    <th ng2-st-add-button *ngIf="showActionColumnLeft" [grid]="grid" (create)="create.emit($event)"></th>
    <th
      *ngFor="let column of getVisibleColumns(grid.getColumns())"
      class="ng2-smart-th {{ column.id }}"
      [ngStyle]="{ display: column.show ? '' : 'none' }"
    >
      <ng2-smart-table-filter
        [source]="source"
        [column]="column"
        [inputClass]="filterInputClass"
        (filter)="filter.emit($event)"
      ></ng2-smart-table-filter>
    </th>
    <th
      ng2-st-add-button
      *ngIf="showActionColumnRight"
      [grid]="grid"
      [source]="source"
      (create)="create.emit($event)"
    ></th>
  `,
})
export class TheadFitlersRowComponent implements OnChanges {
  @Input() grid!: Grid;
  @Input() source!: DataSource;

  @Output() create = new EventEmitter<any>();
  @Output() filter = new EventEmitter<any>();

  isMultiSelectVisible: boolean = false;
  showActionColumnLeft: boolean = false;
  showActionColumnRight: boolean = false;
  filterInputClass: string = '';

  ngOnChanges() {
    this.isMultiSelectVisible = this.grid.isMultiSelectVisible();
    this.showActionColumnLeft = this.grid.showActionColumn('left');
    this.showActionColumnRight = this.grid.showActionColumn('right');
    this.filterInputClass = this.grid.getSetting('filter.inputClass');
  }

  getVisibleColumns(columns: Array<Column>): Array<Column> {
    return (columns || []).filter((column: Column) => !column.hide);
  }
}
