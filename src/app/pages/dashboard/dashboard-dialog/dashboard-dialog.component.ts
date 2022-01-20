import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { Expense } from '@models/expense';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { UtilsService } from 'app/shared/services/utils.service';

export enum DASHBOARD_COMPONENT_TYPES {
  EXPENSES,
  EXPENSE,
  TRANSFER,
}

@Component({
  selector: 'ngx-dashboard-dialog',
  templateUrl: './dashboard-dialog.component.html',
  styleUrls: ['./dashboard-dialog.component.scss'],
})
export class DashboardDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() iExpense?: Expense;
  @Input() componentType = DASHBOARD_COMPONENT_TYPES.EXPENSES;

  dTypes = DASHBOARD_COMPONENT_TYPES;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<DashboardDialogComponent>,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  dismiss(): void {
    super.dismiss();
  }
}
