import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { Column } from '../../../../lib/data-set/column';
import { DataSource } from '../../../../lib/data-source/data-source';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';

@Component({
  selector: 'ng2-smart-table-title',
  styleUrls: ['./title.component.scss'],
  template: `
    <a
      href="#"
      *ngIf="column.isSortable"
      (click)="_sort($event)"
      class="ng2-smart-sort-link sort"
      [ngClass]="currentDirection"
    >
      {{ column.title }}
    </a>
    <span class="ng2-smart-sort" *ngIf="!column.isSortable">{{ column.title }}</span>
  `,
})
export class TitleComponent implements OnChanges {
  currentDirection = '';
  @Input() column!: Column;
  @Input() source: DataSource = new LocalDataSource();
  @Output() sort = new EventEmitter<any>();

  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.source) {
      this.source
        .onChanged()
        .pipe(takeUntil(this.destroy$))
        .subscribe((dataChanges) => {
          const sortConf = this.source.getSort();

          if (sortConf.length > 0 && sortConf[0]['field'] === this.column.id) {
            this.currentDirection = sortConf[0]['direction'];
          } else {
            this.currentDirection = '';
          }

          sortConf.forEach((fieldConf: any) => {});
        });
    }
  }

  _sort(event: any) {
    event.preventDefault();
    this.changeSortDirection();
    this.source.setSort([
      {
        field: this.column.id,
        direction: this.currentDirection,
        compare: this.column.getCompareFunction(),
      },
    ]);
    this.sort.emit(null);
  }

  changeSortDirection(): string {
    if (this.currentDirection) {
      const newDirection = this.currentDirection === 'asc' ? 'desc' : 'asc';
      this.currentDirection = newDirection;
    } else {
      this.currentDirection = this.column.sortDirection;
    }
    return this.currentDirection;
  }
}
