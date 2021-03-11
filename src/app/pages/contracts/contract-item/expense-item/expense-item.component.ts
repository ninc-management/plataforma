import { Component, OnInit, Input } from '@angular/core';
import { NbFileUploaderOptions } from '../../../../@theme/components';
import { format } from 'date-fns';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import * as contract_validation from '../../../../shared/payment-validation.json';

@Component({
  selector: 'ngx-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.scss'],
})
export class ExpenseItemComponent implements OnInit {
  @Input() contract: any;
  @Input() contractIndex: number;
  @Input() expenseIndex: number;
  validation = (contract_validation as any).default;
  today = new Date();
  expense: any = {
    paid: false,
    nf: true,
    created: this.today,
    lastUpdate: this.today,
  };
  options = {
    lastUpdateDate: format(this.expense.lastUpdate, 'dd/MM/yyyy'),
  };
  uploaderOptions: NbFileUploaderOptions;
  urls: string[] = [];
  allowedMimeType = ['image/png', 'image/jpg', 'image/jpeg'];
  fileTypesAllowed: string[];
  maxFileSize = 5;

  constructor() {}

  ngOnInit(): void {
    this.fileTypesAllowed = this.allowedMimeType.map((fileType: string) =>
      fileType.substring(fileType.lastIndexOf('/') + 1, fileType.length)
    );
    this.uploaderOptions = {
      multiple: false,
      directory: false,
      showUploadQueue: true,
      allowedFileTypes: this.allowedMimeType,
      filter: {
        fn: (item: File) => {
          // Verifica se arquivo é maior que maxFileSize mb
          if (item.size / 1024 / 1024 > this.maxFileSize) {
            return false;
          }
          const itemType =
            item.name.substring(
              item.name.lastIndexOf('.') + 1,
              item.name.length
            ) || item.name;
          if (!this.fileTypesAllowed.includes(itemType)) {
            return false;
          }
          return true;
        },
      },
    };
  }

  urlReceiver(fileList: BehaviorSubject<any>[]): void {
    this.urls = [];
    for (const file$ of fileList) {
      if (file$.getValue().isSuccess || file$.getValue().isError) {
        this.urls.push(file$.getValue().url);
      } else {
        const urlIndex = this.urls.push(file$.getValue().url) - 1;
        file$
          .pipe(take(2))
          .subscribe((file) => (this.urls[urlIndex] = file.url));
      }
    }
  }

  registerExpense(): void {}

  updatePaidDate(): void {}
}
