import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

import { Column } from '../../../lib/data-set/column';

@Component({
  template: '',
})
export class DefaultFilter implements Filter, OnDestroy {
  delay: number = 300;
  protected destroy$: Subject<void> = new Subject<void>();
  @Input() query: string = '';
  @Input() inputClass: string = '';
  @Input() column!: Column;
  @Output() filter = new EventEmitter<string>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFilter() {
    this.filter.emit(this.query);
  }
}

export interface Filter {
  delay?: number;
  changesSubscription?: Subscription;
  query: string;
  inputClass: string;
  column: Column;
  filter: EventEmitter<string>;
}
