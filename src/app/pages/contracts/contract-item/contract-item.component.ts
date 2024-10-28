import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { isOfType, isPhone } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';

enum TABS {
  DATA = 'Dados',
  MANAGEMENT = 'Gestão',
  BALANCE = 'Balanço',
  RECEIPTS = 'Ordens de empenho',
  PAYMENTS = 'Ordens de pagamento',
  EXPENSES = 'Despesas',
}

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
})
export class ContractItemComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() isContractNotEdited$: BehaviorSubject<() => boolean> = new BehaviorSubject<() => boolean>(() => true);

  TABS = TABS;
  tabActive = TABS.DATA;

  clonedContract: Contract = new Contract();

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

  constructor(private contractService: ContractService, private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.clonedContract = cloneDeep(this.contract);
    this.contractService.submittedToEdit$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.clonedContract.__v !== undefined) this.clonedContract.__v += 1;
    });
    this.invoiceService.submittedToEdit$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (
        this.clonedContract.invoice &&
        isOfType(Invoice, this.clonedContract.invoice) &&
        this.clonedContract.invoice.__v !== undefined
      )
        this.clonedContract.invoice.__v += 1;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  expenseIndex(code: 'string'): number {
    return this.clonedContract.expenses.findIndex((expense) => expense.code == code);
  }

  getActiveTab(e: any) {
    this.tabActive = e.tabTitle;
  }
}
