import { Component, Input, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Observable, skipWhile, take } from 'rxjs';

import { ReceivablesDialogComponent } from '../user-receivables/receivables-dialog/receivables-dialog.component';
import { MetricsService, ReceivableByContract } from 'app/shared/services/metrics.service';
import { UserService } from 'app/shared/services/user.service';

enum METRIC_TITLES {
  RECEIVABLE_VALUE = 'Valor a receber',
}

export interface MetricItem {
  title: string;
  tooltip: string;
  value: Observable<string>;
  previousValue?: Observable<string>;
  loading: Observable<boolean>;
}

@Component({
  selector: 'ngx-metric-item',
  templateUrl: './metric-item.component.html',
  styleUrls: ['./metric-item.component.scss'],
})
export class MetricItemComponent implements OnInit {
  @Input() metricItem: MetricItem = {} as MetricItem;
  userReceivableContracts: ReceivableByContract[] = [];

  METRIC_TITLES = METRIC_TITLES;

  constructor(
    private dialogService: NbDialogService,
    private metricsService: MetricsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {}

  openReceivablesDialog(): void {
    this.userService.currentUser$
      .pipe(
        skipWhile((user) => user._id === undefined),
        take(1)
      )
      .subscribe((user) => {
        this.metricsService
          .userReceivableValue(user._id)
          .pipe(take(1))
          .subscribe((userReceivable) => {
            this.dialogService.open(ReceivablesDialogComponent, {
              context: {
                userReceivableContracts: userReceivable.receivableContracts,
              },
              dialogClass: 'my-dialog',
              closeOnBackdropClick: false,
              closeOnEsc: false,
              autoFocus: false,
            });
          });
      });
  }
}
