import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { cloneDeep } from 'lodash';
import { Contract } from '@models/contract';
import { isPhone } from 'app/shared/utils';

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
})
export class ContractItemComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);

  clonedContract: Contract = new Contract();
  responseEvent = new Subject<void>();

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

  forwardResponse() {
    this.responseEvent.next();
  }
}
