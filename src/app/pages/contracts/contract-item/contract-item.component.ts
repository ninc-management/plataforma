import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Subject } from 'rxjs';

import { isPhone } from 'app/shared/utils';

import { Contract } from '@models/contract';

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractItemComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);

  clonedContract: Contract = new Contract();
  recalculateEvent$ = new Subject<void>();

  isPhone = isPhone;

  contractIcon = {
    icon: 'file-invoice',
    pack: 'fac',
  };
  paymentIcon = {
    icon: 'dollar-sign',
    pack: 'fa',
  };
  receiptIcon = {
    icon: 'receipt',
    pack: 'fac',
  };
  expenseIcon = {
    icon: 'minus',
    pack: 'fac',
  };
  scaleIcon = {
    icon: 'scale',
    pack: 'fac',
  };

  constructor() {}

  ngOnInit(): void {
    this.clonedContract = cloneDeep(this.contract);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  expenseIndex(code: 'string'): number {
    return this.clonedContract.expenses.findIndex((expense) => expense.code == code);
  }

  recalculateValues() {
    this.recalculateEvent$.next();
  }
}
