import { Component, Input, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Observable } from 'rxjs';

import { ReceivablesDialogComponent } from '../user-receivables/receivables-dialog/receivables-dialog.component';

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

  constructor(private dialogService: NbDialogService) {}

  ngOnInit(): void {}

  openReceivablesDialog(): void {
    this.dialogService.open(ReceivablesDialogComponent, {
      context: {
        userReceivableContracts: [],
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
