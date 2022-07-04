import { Component, Input, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { map, Observable, skipWhile, take } from 'rxjs';

import { ReceivablesDialogComponent } from '../user-receivables/receivables-dialog/receivables-dialog.component';
import { MetricsService, ReceivableByContract } from 'app/shared/services/metrics.service';
import { UserService } from 'app/shared/services/user.service';

export interface MetricItem {
  title: string;
  tooltip: string;
  value: Observable<string>;
  description: Observable<string>;
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

  constructor(
    private dialogService: NbDialogService,
    private metricsService: MetricsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    /*TODO
      Investigate a way to pass specific data inside metric item to avoid calling this function
      everytime the component is initialized
    */
    this.userService.currentUser$
      .pipe(
        skipWhile((user) => user._id === undefined),
        take(1)
      )
      .subscribe((user) => {
        this.metricsService.userReceivableValue(user._id).pipe(
          map((userReceivable) => {
            this.userReceivableContracts = userReceivable.receivableContracts;
          })
        );
      });
  }

  openReceivablesDialog(): void {
    this.dialogService.open(ReceivablesDialogComponent, {
      context: {
        userReceivableContracts: this.userReceivableContracts,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
