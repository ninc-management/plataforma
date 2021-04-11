import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { NgModel, NgForm } from '@angular/forms';
import {
  NbFileUploaderOptions,
  StorageProvider,
} from '../../../../@theme/components';
import { format, parseISO } from 'date-fns';
import { take, takeUntil, skip } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { CompleterData, CompleterService } from 'ng2-completer';
import {
  ContractService,
  EXPENSE_TYPES,
} from '../../../../shared/services/contract.service';
import { OnedriveService } from '../../../../shared/services/onedrive.service';
import {
  UserService,
  CONTRACT_BALANCE,
} from '../../../../shared/services/user.service';
import { StringUtilService } from '../../../../shared/services/string-util.service';
import * as _ from 'lodash';
import * as expense_validation from '../../../../shared/payment-validation.json';

interface UploadedFile {
  name: string;
  url: string;
}

@Component({
  selector: 'ngx-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.scss'],
})
export class ExpenseItemComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true })
  formRef: NgForm;
  @Input()
  contract: any;
  @Input() contractIndex: number;
  @Input() expenseIndex: number;
  @Output() submit: EventEmitter<void> = new EventEmitter<void>();
  private destroy$ = new Subject<void>();
  validation = (expense_validation as any).default;
  uploadedFiles: UploadedFile[] = [];
  today = new Date();
  types = Object.values(EXPENSE_TYPES);
  expense: any = {
    paid: true,
    nf: true,
    created: this.today,
    lastUpdate: this.today,
  };
  options = {
    lastUpdateDate: format(this.expense.lastUpdate, 'dd/MM/yyyy'),
  };
  uploaderOptions: NbFileUploaderOptions;
  urls: string[] = [];
  allowedMimeType = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
  fileTypesAllowed: string[];
  maxFileSize = 4;

  userSearch: string;
  userData: CompleterData;

  sourceSearch: string;
  sourceData: CompleterData;
  private sourceArray = new BehaviorSubject<any[]>([]);
  lastType: EXPENSE_TYPES;

  constructor(
    private contractService: ContractService,
    private stringUtil: StringUtilService,
    private completerService: CompleterService,
    private onedrive: OnedriveService,
    public userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.fileTypesAllowed = this.allowedMimeType.map((fileType: string) =>
      fileType.substring(fileType.lastIndexOf('/') + 1, fileType.length)
    );
    this.updateUploaderOptions();

    this.userData = this.completerService
      .local(
        this.contract.team.map((member) => member.user),
        'fullName',
        'fullName'
      )
      .imageField('profilePicture');
    let tmp = this.contract.team.map((member) => member.user);
    tmp.unshift(CONTRACT_BALANCE);
    this.sourceArray.next(tmp);

    if (this.expenseIndex !== undefined) {
      this.expense = _.cloneDeep(this.contract.expenses[this.expenseIndex]);
      if (
        this.expense.paidDate !== undefined &&
        typeof this.expense.paidDate !== 'object'
      )
        this.expense.paidDate = parseISO(this.expense.paidDate);
      if (
        this.expense.created !== undefined &&
        typeof this.expense.created !== 'object'
      )
        this.expense.created = parseISO(this.expense.created);
      if (
        this.expense.lastUpdate !== undefined &&
        typeof this.expense.lastUpdate !== 'object'
      ) {
        this.expense.lastUpdate = parseISO(this.expense.lastUpdate);
        this.expense.lastUpdate = format(this.expense.lastUpdate, 'dd/MM/yyyy');
      }
      this.expense.author = this.userService.idToUser(this.expense.author);
      this.expense.source = this.userService.idToUser(this.expense.source);
      this.uploadedFiles = _.cloneDeep(
        this.expense.uploadedFiles
      ) as UploadedFile[];
      if (this.expense.type === EXPENSE_TYPES.APORTE)
        this.removeContractBalanceMember();
      this.lastType = this.expense.type;
    } else {
      this.userService.currentUser$.pipe(take(1)).subscribe((author) => {
        this.expense.author = author;
      });
      this.updatePaidDate();
    }
    this.sourceData = this.completerService
      .local(this.sourceArray.asObservable(), 'fullName', 'fullName')
      .imageField('profilePicture');
    this.userSearch = this.expense.author.fullName;
    this.sourceSearch = this.expense.source?.fullName;

    this.formRef.control.statusChanges
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((status) => {
        if (status === 'VALID' && this.expense.nf === true)
          this.updateUploaderOptions();
      });
  }

  updateUploaderOptions(): void {
    this.uploaderOptions = {
      multiple: false,
      directory: false,
      showUploadQueue: true,
      storageProvider: StorageProvider.ONEDRIVE,
      mediaFolderPath:
        this.onedrive.generatePath(this.contract.invoice) + '/Recibos',
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
      name: {
        fn: (name: string) => {
          const item = (this.expenseIndex !== undefined
            ? this.expenseIndex + 1
            : this.contract.expenses.length + 1
          ).toString();
          const type = this.expense.type;
          const value = this.expense.value.replace('.', '');
          const date = format(new Date(), 'dd-MM-yy');
          const extension = name.match('[.].+');
          console.log(name, extension);
          return item + '-' + type + '-' + value + '-' + date + extension;
        },
      },
    };
  }

  addContractBalanceMember(): void {
    let tmp = this.sourceArray.value;
    tmp.unshift(CONTRACT_BALANCE);
    this.sourceArray.next(tmp);
  }

  removeContractBalanceMember(): void {
    let tmp = this.sourceArray.value;
    tmp.shift();
    this.sourceArray.next(tmp);
  }

  handleContractMember(): void {
    if (
      this.expense.type === EXPENSE_TYPES.APORTE &&
      this.lastType !== EXPENSE_TYPES.APORTE
    ) {
      this.removeContractBalanceMember();
      if (this.expense.source._id === CONTRACT_BALANCE._id) {
        this.sourceSearch = '';
        this.expense.source = undefined;
      }
    }
    if (
      this.expense.type !== EXPENSE_TYPES.APORTE &&
      this.lastType === EXPENSE_TYPES.APORTE
    ) {
      this.addContractBalanceMember();
    }
    this.lastType = this.expense.type;
  }

  urlReceiver(fileList: BehaviorSubject<any>[]): void {
    this.urls = [];
    for (const file$ of fileList) {
      if (file$.getValue().isSuccess || file$.getValue().isError) {
        this.urls.push(file$.getValue().url);
      } else {
        const urlIndex = this.urls.push(file$.getValue().url) - 1;
        file$.pipe(take(2)).subscribe((file) => {
          this.urls[urlIndex] = file.url;
          if (file.url)
            this.uploadedFiles.push({ name: file.name, url: file.url });
        });
      }
    }
  }

  registerExpense(): void {
    this.expense.uploadedFiles = _.cloneDeep(this.uploadedFiles);
    if (this.expenseIndex !== undefined) {
      this.expense.lastUpdate = new Date();
      this.contract.expenses[this.expenseIndex] = _.cloneDeep(this.expense);
    } else {
      this.contract.expenses.push(_.cloneDeep(this.expense));
    }
    this.contractService.editContract(this.contract);
    this.submit.emit();
  }

  updatePaidDate(): void {
    if (!this.expense.paid) this.expense.paidDate = undefined;
    else this.expense.paidDate = new Date();
  }

  addAndClean(): void {
    this.expense.uploadedFiles = _.cloneDeep(this.uploadedFiles);
    this.contract.expenses.push(_.cloneDeep(this.expense));
    this.contractService.editContract(this.contract);
    delete this.sourceSearch;
    delete this.expense.source;
    delete this.expense.description;
    delete this.expense.type;
    delete this.expense.value;
    delete this.expense.description;
    this.uploadedFiles = [];
    this.expense.created = this.today;
    this.expense.lastUpdate = this.today;
    this.expense.paid = true;
    this.updatePaidDate();
  }

  removeFile(index: number): void {
    //TODO: Remove file on Onedrive
    this.uploadedFiles.splice(index, 1);
  }

  overPaid(): string {
    if (this.expense.source?._id === CONTRACT_BALANCE._id) {
      return this.contract.balance;
    }
    return this.stringUtil.numberToMoney(Number.MAX_VALUE);
  }

  forceValidatorUpdate(model: NgModel, time = 1): void {
    setTimeout(() => {
      model.control.updateValueAndValidity();
    }, time);
  }
}
