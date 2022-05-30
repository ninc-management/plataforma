import { Component, OnInit, Input, OnDestroy, ViewChild } from '@angular/core';
import { take, takeUntil, skip } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { cloneDeep, isEqual } from 'lodash';
import { ContractService, EXPENSE_TYPES, SPLIT_TYPES } from 'app/shared/services/contract.service';
import { OneDriveService } from 'app/shared/services/onedrive.service';
import { UserService, CONTRACT_BALANCE, CLIENT } from 'app/shared/services/user.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { BaseExpenseComponent } from 'app/shared/components/base-expense/base-expense.component';
import { ContractExpenseTeamMember, ContractExpense, Contract } from '@models/contract';
import { User } from '@models/user';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import expense_validation from 'app/shared/expense-validation.json';
import { Sector } from '@models/shared';
import { TeamService } from 'app/shared/services/team.service';
import {
  isPhone,
  formatDate,
  compareFiles,
  forceValidatorUpdate,
  trackByIndex,
  shouldNotifyManager,
} from 'app/shared/utils';
import { NotificationService, NotificationTags } from 'app/shared/services/notification.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'ngx-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.scss'],
})
export class ExpenseItemComponent extends BaseExpenseComponent implements OnInit, OnDestroy {
  @Input() contract = new Contract();
  @Input() expenseIndex?: number;
  @Input() availableContracts: Contract[] = [];
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @ViewChild('form') ngForm = {} as NgForm;

  invoice = new Invoice();
  hasInitialContract = true;
  validation = expense_validation as any;
  USER_SECTORS: Sector[] = [];
  types = Object.values(EXPENSE_TYPES);
  expenseTypes = EXPENSE_TYPES;
  splitTypes = SPLIT_TYPES;
  balanceID = CONTRACT_BALANCE._id;
  isEditionGranted = false;
  expense: ContractExpense = {
    author: '',
    source: '',
    description: '',
    nf: true,
    type: '',
    splitType: 'Individual',
    value: '',
    created: this.today,
    lastUpdate: this.today,
    paid: true,
    team: [],
    uploadedFiles: [],
    code: '#0',
  };

  options = {
    lastValue: '0',
    lastTeam: [] as ContractExpenseTeamMember[],
  };
  splitSelectedMember = new User();

  contractSearch = '';
  get availableContractsData(): Observable<Contract[]> {
    return of(this.availableContracts);
  }

  isPhone = isPhone;
  forceValidatorUpdate = forceValidatorUpdate;
  trackByIndex = trackByIndex;
  formatDate = formatDate;

  lastType = EXPENSE_TYPES.MATERIAL;

  initialFiles: UploadedFile[] = [];
  registered: boolean = false;
  folderPath: string = '';

  get is100(): boolean {
    const total = this.expense.team.reduce((sum, m) => {
      sum = this.stringUtil.sumMoney(sum, m.percentage);
      return sum;
    }, '0,00');
    return total === '99,99' || total === '100,00' || total === '100,01';
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
        member.user && this.userService.idToUser(member.user)?._id == this.splitSelectedMember?._id
    );
  }

  constructor(
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private notificationService: NotificationService,
    protected stringUtil: StringUtilService,
    protected onedrive: OneDriveService,
    public userService: UserService,
    public teamService: TeamService
  ) {
    super(stringUtil, onedrive, userService);
  }

  ngOnDestroy(): void {
    if (!this.registered && !isEqual(this.initialFiles, this.uploadedFiles)) {
      this.deleteFiles();
    }
    super.ngOnDestroy();
  }

  ngOnInit(): void {
    super.ngOnInit();

    if (this.contract._id) this.fillContractData();
    else this.hasInitialContract = false;

    this.formRef.control.statusChanges.pipe(skip(1), takeUntil(this.destroy$)).subscribe((status) => {
      if (status === 'VALID' && this.expense.nf === true) this.updateUploaderOptions();
    });

    this.initialFiles = cloneDeep(this.uploadedFiles);
  }

  ngAfterViewInit(): void {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  fillContractData(): void {
    this.sourceSearch = '';
    this.expense.source = '';

    this.updateUploaderOptions();

    if (this.contract.invoice !== undefined) this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);

    const tmp = this.invoice.team
      .map((member: InvoiceTeamMember): User | undefined => {
        if (member.user) return this.userService.idToUser(member.user);
        return;
      })
      .filter((user: User | undefined): user is User => user !== undefined);
    this.userArray.next(tmp);
    tmp.unshift(CONTRACT_BALANCE);
    tmp.unshift(CLIENT);
    this.sourceArray.next(tmp);

    if (this.expenseIndex !== undefined) {
      this.expense = cloneDeep(this.contract.expenses[this.expenseIndex]);
      if (this.expense.author) this.expense.author = this.userService.idToUser(this.expense.author);
      if (this.expense.source) this.expense.source = this.userService.idToUser(this.expense.source);

      this.uploadedFiles = cloneDeep(this.expense.uploadedFiles) as UploadedFile[];
      if (this.expense.type === EXPENSE_TYPES.APORTE) this.removeContractBalanceMember();
      this.lastType = this.expense.type as EXPENSE_TYPES;
      if (this.expense.splitType === SPLIT_TYPES.INDIVIDUAL) {
        const sMember = this.expense.team.find((member) => member.percentage === '100,00');
        if (sMember && sMember.user) this.splitSelectedMember = this.userService.idToUser(sMember.user);
      }
    } else {
      this.userService.currentUser$.pipe(take(1)).subscribe((author) => {
        const member = this.invoice.team.find(
          (member: InvoiceTeamMember) => member.user && this.userService.idToUser(member.user)._id == author._id
        );
        if (member) this.expense.author = member.user;
      });
      this.updatePaidDate();
    }
    this.contractService
      .checkEditPermission(this.invoice)
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isEditionGranted = isGranted;
      });

    if (!this.expense.team || this.expense.team.length == 0)
      this.expense.team = this.invoice.team.map((member: InvoiceTeamMember) => ({
        user: member.user,
        value: '0,00',
        percentage: member.distribution,
        sector: member.sector,
      }));

    this.userSearch = this.expense.author ? this.userService.idToUser(this.expense.author)?.fullName : '';
    this.sourceSearch = this.expense.source ? this.userService.idToUser(this.expense.source)?.fullName : '';

    if (this.expense.team.length > 0 && this.expense.team[0].user) {
      if (this.splitSelectedMember._id == undefined)
        this.splitSelectedMember = this.userService.idToUser(this.expense.team[0].user);
      this.USER_SECTORS = this.teamService.userToSectors(this.splitSelectedMember._id);
    }
    if (this.expenseIndex == undefined) this.updateTeamValues();
  }

  updateUploaderOptions(): void {
    if (this.contract.invoice) {
      const mediaFolderPath =
        this.onedrive.generatePath(this.invoiceService.idToInvoice(this.contract.invoice)) + '/Recibos';
      const fn = (name: string) => {
        const item = (
          this.expenseIndex !== undefined ? this.expenseIndex + 1 : this.contract.expenses.length + 1
        ).toString();
        const type = this.expense.type;
        const value = this.expense.value.replace(/\./g, '');
        const date = formatDate(new Date(), '-');
        const extension = name.match('[.].+');
        return item + '-' + type + '-' + value + '-' + date + extension;
      };
      this.folderPath = mediaFolderPath;
      super.updateUploaderOptions(mediaFolderPath, fn);
    }
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
    if (this.expense.type === EXPENSE_TYPES.APORTE && this.lastType !== EXPENSE_TYPES.APORTE) {
      this.removeContractBalanceMember();
      if (this.expense.source && this.userService.idToUser(this.expense.source)._id === CONTRACT_BALANCE._id) {
        this.sourceSearch = '';
        this.expense.source = undefined;
      }
    }
    if (this.expense.type !== EXPENSE_TYPES.APORTE && this.lastType === EXPENSE_TYPES.APORTE) {
      this.addContractBalanceMember();
    }
    if (this.expense.type === EXPENSE_TYPES.APORTE) this.expense.splitType = SPLIT_TYPES.INDIVIDUAL;
    this.lastType = this.expense.type as EXPENSE_TYPES;
  }

  registerExpense(): void {
    this.registered = true;
    this.contract.createdExpenses += 1;
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
    if (this.expenseIndex !== undefined) {
      if (shouldNotifyManager(this.contract.expenses[this.expenseIndex], this.expense)) this.notifyManager();
      this.expense.lastUpdate = new Date();
      this.contract.expenses[this.expenseIndex] = cloneDeep(this.expense);
    } else {
      this.expense.code = '#' + this.contract.createdExpenses.toString();
      this.contract.expenses.push(cloneDeep(this.expense));
    }
    this.contractService.editContract(this.contract);
    setTimeout(() => {
      this.isFormDirty.next(false);
      this.submit.emit();
    }, 10);
  }

  addAndClean(): void {
    this.contract.createdExpenses += 1;
    this.expense.code = '#' + this.contract.createdExpenses.toString();
    this.newExpense$.next();
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
    this.contract.expenses.push(cloneDeep(this.expense));
    this.contractService.editContract(this.contract);
    this.sourceSearch = '';
    this.expense.source = '';
    this.expense.description = '';
    this.expense.value = '';
    this.uploadedFiles = [];
    this.expense.created = this.today;
    this.expense.lastUpdate = this.today;
    this.expense.paid = true;
    this.updatePaidDate();
    this.ngForm.form.markAsPristine();
    setTimeout(() => {
      this.isFormDirty.next(false);
    }, 10);
  }

  overPaid(): string {
    if (this.expense.source && this.userService.idToUser(this.expense.source)?._id === CONTRACT_BALANCE._id) {
      if (this.expenseIndex != undefined)
        return this.stringUtil.sumMoney(this.contract.balance, this.contract.expenses[this.expenseIndex].value);
      else return this.contract.balance;
    }
    return this.stringUtil.numberToMoney(Number.MAX_VALUE);
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
    this.options.lastValue = this.expense.value ? this.expense.value.slice() : '0';
    this.options.lastTeam = cloneDeep(this.expense.team);
  }

  calculateTeamValues(): void {
    if (this.expense.value !== '0') {
      this.expense.team.map((member) => {
        member.value = this.stringUtil.applyPercentage(this.expense.value, member.percentage);
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
          this.expense.team[index].percentage = this.invoice.team[index].distribution;
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

  updatePaidDate(): void {
    if (!this.expense.paid) this.expense.paidDate = undefined;
    else this.expense.paidDate = new Date();
  }

  fixComissionSource(): void {
    if (this.expense.type === EXPENSE_TYPES.COMISSAO) {
      this.expense.source = CONTRACT_BALANCE;
      this.sourceSearch = CONTRACT_BALANCE.fullName;
    }
  }

  isRadioDisabled(): boolean {
    if (this.expense.team.length == 1) {
      this.expense.splitType = SPLIT_TYPES.INDIVIDUAL;
      return true;
    }
    return this.expense.type === EXPENSE_TYPES.APORTE;
  }

  deleteFiles(): void {
    const filesToRemove = this.uploadedFiles.filter((file) => !compareFiles(this.initialFiles, file));
    if (filesToRemove.length > 0) this.onedrive.deleteFiles(this.folderPath, filesToRemove);
  }

  notifyManager(): void {
    if (this.contract.invoice) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.notificationService.notify(invoice.author, {
        title: 'Uma despesa do contrato ' + this.contract.code + ' foi paga!',
        tag: NotificationTags.EXPENSE_PAID,
        message: 'A despesa de código ' + this.expense.code + ' com o valor de R$ ' + this.expense.value + ' foi paga.',
      });
    }
  }
}
