import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { cloneDeep } from 'lodash';
import { Contract } from '@models/contract';
import { UtilsService } from 'app/shared/services/utils.service';

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
})
export class ContractItemComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() iContract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  contract: Contract = new Contract();
  responseEvent = new Subject<void>();

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

  constructor(public utils: UtilsService) {}

  ngOnInit(): void {
    this.contract = cloneDeep(this.iContract);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  expenseIndex(code: 'string'): number {
    return this.contract.expenses.findIndex((expense) => expense.code == code);
  }

  forwardResponse() {
    this.responseEvent.next();
  }
}
