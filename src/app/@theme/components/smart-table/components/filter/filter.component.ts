import { Component, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { FilterDefault } from './filter-default';

@Component({
  selector: 'ng2-smart-table-filter',
  styleUrls: ['./filter.component.scss'],
  template: `
    <div class="ng2-smart-filter" *ngIf="column.isFilterable" [ngSwitch]="column.getFilterType()">
      <custom-table-filter
        *ngSwitchCase="'custom'"
        [query]="query"
        [column]="column"
        [source]="source"
        [inputClass]="inputClass"
        (filter)="onFilter($event)"
      ></custom-table-filter>
      <default-table-filter
        *ngSwitchDefault
        [query]="query"
        [column]="column"
        [source]="source"
        [inputClass]="inputClass"
        (filter)="onFilter($event)"
      ></default-table-filter>
    </div>
  `,
})
export class FilterComponent extends FilterDefault implements OnChanges, OnDestroy, OnInit {
  query: string = '';
  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.handleChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.source) {
      this.source
        .onChanged()
        .pipe(takeUntil(this.destroy$))
        .subscribe((dataChanges) => {
          this.handleChanges();
        });
    }
  }

  handleChanges(): void {
    //updatequery
    const filterConf = this.source.getFilter();
    if (filterConf && filterConf.filters && filterConf.filters.length === 0) {
      this.query = '';

      // add a check for existing filters an set the query if one exists for this column
      // this covers instances where the filter is set by user code while maintaining existing functionality
    } else if (filterConf && filterConf.filters && filterConf.filters.length > 0) {
      filterConf.filters.forEach((k: any, v: any) => {
        if (k.field == this.column.id) {
          this.query = k.search;
        }
      });
    }
  }
}
