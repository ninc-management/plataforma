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
} from 'app/@theme/components';
import { take, takeUntil, skip } from 'rxjs/operators';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { CompleterData, CompleterService } from 'ng2-completer';
import {
  ContractService,
  EXPENSE_TYPES,
  SPLIT_TYPES,
} from 'app/shared/services/contract.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import {
  UserService,
  CONTRACT_BALANCE,
} from 'app/shared/services/user.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { cloneDeep } from 'lodash';
import {
  ContractTeamMember,
  ContractExpense,
  ContractExpenseTeamMember,
  Contract,
} from '../../../../../../backend/src/models/contract';
import { User } from '../../../../../../backend/src/models/user';
import * as expense_validation from 'app//shared/expense-validation.json';

@Component({
  selector: 'ngx-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.scss'],
})
export class ExpenseItemComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true })
  formRef!: NgForm;
  @Input()
  contract = new Contract();
  @Input() contractIndex?: number;
  @Input() expenseIndex?: number;
  @Output() submit: EventEmitter<void> = new EventEmitter<void>();
  private destroy$ = new Subject<void>();
  private newExpense$ = new Subject<void>();
  validation = (expense_validation as any).default;
  uploadedFiles: UploadedFile[] = [];
  USER_COORDINATIONS: string[] = [];
  today = new Date();
  types = Object.values(EXPENSE_TYPES);
  sTypes = Object.values(SPLIT_TYPES);
  expenseTypes = EXPENSE_TYPES;
  splitTypes = SPLIT_TYPES;
  balanceID = CONTRACT_BALANCE._id;
  expense: ContractExpense = {
    author: '',
    source: '',
    description: '',
    nf: true,
    type: '',
    splitType: '',
    value: '',
    created: this.today,
    lastUpdate: this.today,
    paid: true,
    team: [],
    uploadedFiles: [],
    number: '#0',
  };
  options = {
    lastValue: '0',
    lastTeam: [] as ContractExpenseTeamMember[],
  };
  splitSelectedMember = new User();
  uploaderOptions: NbFileUploaderOptions = {
    multiple: true,
    directory: false,
    showUploadQueue: true,
    storageProvider: StorageProvider.ONEDRIVE,
    mediaFolderPath: 'profileImages/',
  };
  allowedMimeType = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
  fileTypesAllowed: string[] = [];
  maxFileSize = 4;

  userSearch = '';
  userData: CompleterData = this.completerService.local([]);

  sourceSearch = '';
  sourceData: CompleterData = this.completerService.local([]);
  private sourceArray = new BehaviorSubject<User[]>([]);
  lastType = EXPENSE_TYPES.MATERIAL;

  get is100(): boolean {
    return (
      this.expense.team.reduce((sum, m) => {
        sum = this.stringUtil.sumMoney(sum, m.percentage);
        return sum;
      }, '0,00') === '100,00'
    );
  }

  get teamUsers(): User[] {
    return this.expense.team
      .map((member: ContractExpenseTeamMember): User | undefined => {
        if (member.user) return this.userService.idToUser(member.user);
        return;
      })
      .filter((user: User | undefined): user is User => user !== undefined);
  }

  get sMemberIndex(): number {
    return this.expense.team.findIndex(
      (member: ContractExpenseTeamMember) =>
        member.user &&
        this.userService.idToUser(member.user)?._id ==
          this.splitSelectedMember?._id
    );
  }

  constructor(
    private contractService: ContractService,
    private invoiceService: InvoiceService,
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

    const tmp = this.contract.team
      .map((member: ContractTeamMember): User | undefined => {
        if (member.user) return this.userService.idToUser(member.user);
        return;
      })
      .filter((user: User | undefined): user is User => user !== undefined);
    this.userData = this.completerService
      .local(tmp, 'fullName', 'fullName')
      .imageField('profilePicture');
    tmp.unshift(CONTRACT_BALANCE);
    this.sourceArray.next(tmp);

    if (this.expenseIndex !== undefined) {
      this.expense = cloneDeep(this.contract.expenses[this.expenseIndex]);
      if (this.expense.author)
        this.expense.author = this.userService.idToUser(this.expense.author);
      if (this.expense.source) {
        this.expense.source = this.userService.idToUser(this.expense.source);
        this.USER_COORDINATIONS = this.departmentService.userCoordinations(
          this.expense.source._id
        );
      }
      this.uploadedFiles = cloneDeep(
        this.expense.uploadedFiles
      ) as UploadedFile[];
      if (this.expense.type === EXPENSE_TYPES.APORTE)
        this.removeContractBalanceMember();
      this.lastType = this.expense.type as EXPENSE_TYPES;
      if (this.expense.splitType === SPLIT_TYPES.INDIVIDUAL) {
        const sMember = this.expense.team.find(
          (member) => member.percentage === '100,00'
        );
        if (sMember && sMember.user)
          this.splitSelectedMember = this.userService.idToUser(sMember.user);
      }
    } else {
      this.userService.currentUser$.pipe(take(1)).subscribe((author) => {
        const member = this.contract.team.find(
          (member: ContractTeamMember) =>
            member.user &&
            this.userService.idToUser(member.user)._id == author._id
        );
        if (member) this.expense.author = member.user;
      });
      this.updatePaidDate();
    }

    if (!this.expense.splitType)
      this.expense.splitType = SPLIT_TYPES.PROPORCIONAL;

    if (!this.expense.team || this.expense.team.length == 0)
      this.expense.team = this.contract.team.map(
        (member: ContractTeamMember) => ({
          user: member.user,
          value: '0,00',
          percentage: member.distribution,
          coordination: member.coordination,
        })
      );

    this.sourceData = this.completerService
      .local(this.sourceArray.asObservable(), 'fullName', 'fullName')
      .imageField('profilePicture');
    this.userSearch = this.expense.author
      ? this.userService.idToUser(this.expense.author)?.fullName
      : '';
    this.sourceSearch = this.expense.source
      ? this.userService.idToUser(this.expense.source)?.fullName
      : '';

    this.formRef.control.statusChanges
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((status) => {
        if (status === 'VALID' && this.expense.nf === true)
          this.updateUploaderOptions();
      });

    if (this.expense.team.length > 0 && this.expense.team[0].user) {
      this.splitSelectedMember = this.userService.idToUser(
        this.expense.team[0].user
      );
      this.USER_COORDINATIONS = this.departmentService.userCoordinations(
        this.splitSelectedMember._id
      );
    }
  }

  updateUploaderOptions(): void {
    if (this.contract.invoice)
      this.uploaderOptions = {
        multiple: true,
        directory: false,
        showUploadQueue: true,
        storageProvider: StorageProvider.ONEDRIVE,
        mediaFolderPath:
          this.onedrive.generatePath(
            this.invoiceService.idToInvoice(this.contract.invoice)
          ) + '/Recibos',
        allowedFileTypes: this.allowedMimeType,
        filter: {
          fn: (item?: File) => {
            if (!item) return false;
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
            const value = this.expense.value.replace(/\./g, '');
            const date = this.utils.formatDate(new Date());
            const extension = name.match('[.].+');
            return item + '-' + type + '-' + value + '-' + date + extension;
          },
        },
      };
  }

  addContractBalanceMember(): void {
    const tmp = this.sourceArray.value;
    tmp.unshift(CONTRACT_BALANCE);
    this.sourceArray.next(tmp);
  }

  removeContractBalanceMember(): void {
    const tmp = this.sourceArray.value;
    tmp.shift();
    this.sourceArray.next(tmp);
  }

  handleContractMember(): void {
    if (
      this.expense.type === EXPENSE_TYPES.APORTE &&
      this.lastType !== EXPENSE_TYPES.APORTE
    ) {
      this.removeContractBalanceMember();
      if (
        this.expense.source &&
        this.userService.idToUser(this.expense.source)._id ===
          CONTRACT_BALANCE._id
      ) {
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
    if (this.expense.type === EXPENSE_TYPES.APORTE)
      this.expense.splitType = SPLIT_TYPES.INDIVIDUAL;
    this.lastType = this.expense.type as EXPENSE_TYPES;
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
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
    if (this.expenseIndex !== undefined) {
      this.expense.lastUpdate = new Date();
      this.contract.expenses[this.expenseIndex] = cloneDeep(this.expense);
    } else {
      this.contract.expenses.push(cloneDeep(this.expense));
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
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
    this.contract.expenses.push(cloneDeep(this.expense));
    this.contractService.editContract(this.contract);
    this.sourceSearch = '';
    this.expense.source = '';
    this.expense.description = '';
    this.expense.value = '';
    this.expense.description = '';
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
    if (
      this.expense.source &&
      this.userService.idToUser(this.expense.source)?._id ===
        CONTRACT_BALANCE._id
    ) {
      return this.contract.balance;
    }
    return this.stringUtil.numberToMoney(Number.MAX_VALUE);
  }

  forceValidatorUpdate(model: NgModel, time = 1): void {
    setTimeout(() => {
      model.control.updateValueAndValidity();
    }, time);
  }

  updateValue(idx: number): void {
    this.expense.team[idx].value = this.stringUtil.applyPercentage(
      this.expense.value,
      this.expense.team[idx].percentage
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
    this.options.lastTeam = cloneDeep(this.expense.team);
  }

  calculateTeamValues(): void {
    if (this.expense.value !== '0') {
      this.expense.team.map((member) => {
        member.value = this.stringUtil.applyPercentage(
          this.expense.value,
          member.percentage
        );
        return member;
      });
    }
  }

  updateTeamValues(): void {
    switch (this.expense.splitType) {
      case SPLIT_TYPES.INDIVIDUAL: {
        for (const member of this.expense.team) {
          member.value = '0,00';
          member.percentage = '0,00';
        }
        if (this.sMemberIndex >= 0) {
          this.expense.team[this.sMemberIndex].value = this.expense.value;
          this.expense.team[this.sMemberIndex].percentage = '100,00';
        }
        break;
      }
      case SPLIT_TYPES.PERSONALIZADO: {
        for (const member of this.expense.team) {
          member.value = '0,00';
          member.percentage = '0,00';
        }
        break;
      }
      case SPLIT_TYPES.PROPORCIONAL: {
        for (let index = 0; index < this.expense.team.length; index++) {
          this.expense.team[index].percentage =
            this.contract.team[index].distribution;
          this.expense.team[index].value = this.stringUtil.applyPercentage(
            this.expense.value,
            this.expense.team[index].percentage
          );
        }
        break;
      }
      default:
        break;
    }
  }
}
