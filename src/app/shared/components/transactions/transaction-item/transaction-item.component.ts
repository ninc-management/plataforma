import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';

import { NbFileUploaderOptions, StorageProvider } from 'app/@theme/components';
import { formatDate, isPhone } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Provider } from '@models/provider';
import { UploadedFile } from '@models/shared';
import { Team } from '@models/team';
import { Transaction } from '@models/transaction';
import { User } from '@models/user';

import transaction_validation from 'app/shared/validators/transaction-validation.json';

enum TRANSACTION_TYPES {
  INTERNAL = 'internal',
  CASH_FLOW = 'cashflow',
}

@Component({
  selector: 'ngx-transaction-item',
  templateUrl: './transaction-item.component.html',
  styleUrls: ['./transaction-item.component.scss'],
})
export class TransactionItemComponent implements OnInit {
  @Input() contract?: Contract;
  @Input() transactionIndex?: number;

  validation = transaction_validation as any;
  transaction: Transaction = new Transaction();
  hasInputContract = false;
  options = {
    liquid: '0,00',
    type: '',
    relatedWithContract: false,
  };
  transactionTypes: TRANSACTION_TYPES[] = Object.values(TRANSACTION_TYPES);

  contractSearch = '';
  get availableContractsData(): Observable<Contract[]> {
    return of([]);
  }
  userSearch = '';
  userData: Observable<User[]> = of([]);

  costCenterSearch = '';
  costCenterData: Observable<(User | Team)[]> = of([]);

  providerSearch = '';
  providerData: Observable<Provider[]> = of([]);

  today = new Date();

  uploadedFiles: UploadedFile[] = [];

  formatDate = formatDate;
  isPhone = isPhone;
  tTypes = [''];

  uploaderOptions: NbFileUploaderOptions = {
    multiple: true,
    directory: false,
    showUploadQueue: true,
    storageProvider: StorageProvider.ONEDRIVE,
    mediaFolderPath: 'profileImages/',
  };

  constructor() {}

  ngOnInit(): void {
    if (this.contract) this.hasInputContract = this.options.relatedWithContract = true;
  }

  overPaid(): string {
    return '1.000,00';
  }

  currentTypeHasSubTypes(): boolean {
    return false;
  }

  removeFile(fileIndex: number): void {
    console.log('remover arquivo');
  }

  registerTransaction(): void {}

  addAndClean(): void {}

  urlReceiver(event: any): void {}

  updateLiquidValue(value: string): void {}
}
