import { Component, Input, OnDestroy } from '@angular/core';
import { NbLayoutDirection, NbLayoutDirectionService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-layout-direction-switcher',
  template: `
    <ngx-switcher
      [firstValue]="directions.RTL"
      [secondValue]="directions.LTR"
      [firstValueLabel]="'RTL'"
      [secondValueLabel]="'LTR'"
      [value]="currentDirection"
      (valueChange)="toggleDirection($event)"
      [vertical]="vertical"
    ></ngx-switcher>
  `,
})
export class LayoutDirectionSwitcherComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  directions = NbLayoutDirection;
  currentDirection: NbLayoutDirection;

  @Input() vertical: boolean = false;

  constructor(private directionService: NbLayoutDirectionService) {
    this.currentDirection = this.directionService.getDirection();

    this.directionService
      .onDirectionChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((newDirection) => (this.currentDirection = newDirection));
  }

  toggleDirection(newDirection: NbLayoutDirection): void {
    this.directionService.setDirection(newDirection);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
