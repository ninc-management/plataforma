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
  NbFileItem,
} from '../../../../@theme/components';
import { format, parseISO } from 'date-fns';
import { take, takeUntil, skip } from 'rxjs/operators';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { CompleterData, CompleterService } from 'ng2-completer';
import {
  ContractService,
  EXPENSE_TYPES,
  SPLIT_TYPES,
} from '../../../../shared/services/contract.service';
import { OnedriveService } from '../../../../shared/services/onedrive.service';
import {
  UserService,
  CONTRACT_BALANCE,
} from '../../../../shared/services/user.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { StringUtilService } from '../../../../shared/services/string-util.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UploadedFile } from '../../../../@theme/components/file-uploader/file-uploader.service';
import * as _ from 'lodash';
import * as expense_validation from '../../../../shared/expense-validation.json';

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
  private newExpense$ = new Subject<void>();
  validation = (expense_validation as any).default;
  uploadedFiles: UploadedFile[] = [];
  USER_COORDINATIONS: string[] = [];
  today = new Date();
  types = Object.values(EXPENSE_TYPES);
  sTypes = Object.values(SPLIT_TYPES);
  splitTypes = SPLIT_TYPES;
  balanceID = CONTRACT_BALANCE._id;
  expense: any = {
    paid: true,
    nf: true,
    created: this.today,
    lastUpdate: this.today,
  };
  options = {
    lastUpdateDate: format(this.expense.lastUpdate, 'dd/MM/yyyy'),
    lastValue: '0',
    lastTeam: [],
  };
  uploaderOptions: NbFileUploaderOptions;
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
    public userService: UserService,
    public departmentService: DepartmentService,
    public utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.newExpense$.next();
    this.newExpense$.complete();
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
      this.USER_COORDINATIONS = this.departmentService.userCoordinations(
        this.expense.source
      );
      this.uploadedFiles = _.cloneDeep(
        this.expense.uploadedFiles
      ) as UploadedFile[];
      if (this.expense.type === EXPENSE_TYPES.APORTE)
        this.removeContractBalanceMember();
      this.lastType = this.expense.type;
    } else {
      this.userService.currentUser$.pipe(take(1)).subscribe((author) => {
        this.expense.author = this.contract.team.find(
          (member) => member.user._id == author._id
        );
      });
      this.updatePaidDate();
    }

    if (!this.expense.splitType)
      this.expense.splitType = SPLIT_TYPES.PROPORCIONAL;

    if (!this.expense.team || this.expense.team.length == 0)
      this.expense.team = this.contract.team.map((member) => ({
        user: member.user,
        value: '0,00',
        percentage: member.distribution,
      }));

    this.sourceData = this.completerService
      .local(this.sourceArray.asObservable(), 'fullName', 'fullName')
      .imageField('profilePicture');
    this.userSearch = this.expense.author?.fullName;
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
      multiple: true,
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
          const item = (
            this.expenseIndex !== undefined
              ? this.expenseIndex + 1
              : this.contract.expenses.length + 1
          ).toString();
          const type = this.expense.type;
          const value = this.expense.value.replace('.', '');
          const date = format(new Date(), 'dd-MM-yy');
          const extension = name.match('[.].+');
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

  urlReceiver(uploadedFile$: Observable<BehaviorSubject<NbFileItem>>): void {
    uploadedFile$.pipe(takeUntil(this.newExpense$)).subscribe((file$) => {
      if (file$)
        file$.pipe(take(2)).subscribe((file) => {
          if (file$.getValue().isSuccess)
            this.uploadedFiles.push({ name: file.name, url: file.url });
        });
    });
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
    this.newExpense$.next();
    this.expense.uploadedFiles = _.cloneDeep(this.uploadedFiles);
    this.contract.expenses.push(_.cloneDeep(this.expense));
    this.contractService.editContract(this.contract);
    this.sourceSearch = undefined;
    this.expense.source = undefined;
    this.expense.description = undefined;
    this.expense.value = undefined;
    this.expense.description = undefined;
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

  selectDefaultCoordination(): void {
    const el = this.contract.team.find(
      (el) => el.user._id == this.expense.source._id
    );
    if (el) this.expense.coordination = el.coordination;
  }

  updateValue(idx: number): void {
    this.expense.team[idx].value = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.expense.value) *
        (1 -
          this.stringUtil.toMutiplyPercentage(
            this.expense.team[idx].percentage
          ))
    );
  }

  updatePercentage(idx: number): void {
    this.expense.team[idx].percentage = this.stringUtil
      .toPercentage(this.expense.team[idx].value, this.expense.value, 20)
      .slice(0, -1);
  }

  updateLastValues(): void {
    this.options.lastValue = this.expense.value
      ? this.expense.value.slice()
      : '0';
    this.options.lastTeam = _.cloneDeep(this.expense.team);
  }

  calculateTeamValues(): void {
    if (this.expense.value !== '0') {
      this.expense.team.map((member) => {
        member.value = this.stringUtil.numberToMoney(
          this.stringUtil.moneyToNumber(this.expense.value) *
            (1 - this.stringUtil.toMutiplyPercentage(member.percentage))
        );
        return member;
      });
    }
  }
}
