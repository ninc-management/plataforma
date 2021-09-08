import { Component, OnInit, Input } from '@angular/core';
import { take, takeUntil, skip, map } from 'rxjs/operators';
import {
  ContractService,
  CONTRACT_STATOOS,
  EXPENSE_TYPES,
  SPLIT_TYPES,
} from 'app/shared/services/contract.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import {
  UserService,
  CONTRACT_BALANCE,
  CLIENT,
} from 'app/shared/services/user.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { cloneDeep } from 'lodash';
import {
  ContractTeamMember,
  ContractExpenseTeamMember,
  ContractExpense,
  Contract,
} from '@models/contract';
import { User } from '@models/user';
import { BaseExpenseComponent } from 'app/shared/components/base-expense/base-expense.component';
import * as expense_validation from 'app//shared/expense-validation.json';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'ngx-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.scss'],
})
export class ExpenseItemComponent
  extends BaseExpenseComponent
  implements OnInit
{
  @Input()
  contract = new Contract();
  @Input() expenseIndex?: number;
  @Input() availableContracts: Contract[] = [];
  hasInitialContract = true;
  validation = (expense_validation as any).default;
  USER_COORDINATIONS: string[] = [];
  types = Object.values(EXPENSE_TYPES);
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
    protected stringUtil: StringUtilService,
    protected onedrive: OnedriveService,
    public userService: UserService,
    public departmentService: DepartmentService,
    public utils: UtilsService
  ) {
    super(stringUtil, onedrive, userService);
  }

  ngOnInit(): void {
    super.ngOnInit();

    if (this.contract._id) this.fillContractData();
    else this.hasInitialContract = false;

    if (!this.expense.splitType)
      this.expense.splitType = SPLIT_TYPES.INDIVIDUAL;

    this.formRef.control.statusChanges
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((status) => {
        if (status === 'VALID' && this.expense.nf === true)
          this.updateUploaderOptions();
      });
  }

  fillContractData(): void {
    this.sourceSearch = '';
    this.expense.source = '';

    this.updateUploaderOptions();

    const tmp = this.contract.team
      .map((member: ContractTeamMember): User | undefined => {
        if (member.user) return this.userService.idToUser(member.user);
        return;
      })
      .filter((user: User | undefined): user is User => user !== undefined);
    this.userData = of(tmp);
    tmp.unshift(CONTRACT_BALANCE);
    tmp.unshift(CLIENT);
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

    if (!this.expense.team || this.expense.team.length == 0)
      this.expense.team = this.contract.team.map(
        (member: ContractTeamMember) => ({
          user: member.user,
          value: '0,00',
          percentage: member.distribution,
          coordination: member.coordination,
        })
      );

    this.sourceData = this.sourceArray;
    this.userSearch = this.expense.author
      ? this.userService.idToUser(this.expense.author)?.fullName
      : '';
    this.sourceSearch = this.expense.source
      ? this.userService.idToUser(this.expense.source)?.fullName
      : '';

    if (this.expense.team.length > 0 && this.expense.team[0].user) {
      if (this.splitSelectedMember._id == undefined)
        this.splitSelectedMember = this.userService.idToUser(
          this.expense.team[0].user
        );
      this.USER_COORDINATIONS = this.departmentService.userCoordinations(
        this.splitSelectedMember._id
      );
    }
  }

  updateUploaderOptions(): void {
    if (this.contract.invoice) {
      const mediaFolderPath =
        this.onedrive.generatePath(
          this.invoiceService.idToInvoice(this.contract.invoice)
        ) + '/Recibos';
      const fn = (name: string) => {
        const item = (
          this.expenseIndex !== undefined
            ? this.expenseIndex + 1
            : this.contract.expenses.length + 1
        ).toString();
        const type = this.expense.type;
        const value = this.expense.value.replace(/\./g, '');
        const date = this.utils.formatDate(new Date(), '-');
        const extension = name.match('[.].+');
        return item + '-' + type + '-' + value + '-' + date + extension;
      };
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

  registerExpense(): void {
    this.contract.createdExpenses += 1;
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
    if (this.expenseIndex !== undefined) {
      this.expense.lastUpdate = new Date();
      this.contract.expenses[this.expenseIndex] = cloneDeep(this.expense);
    } else {
      this.expense.code = '#' + this.contract.createdExpenses.toString();
      this.contract.expenses.push(cloneDeep(this.expense));
    }
    this.contractService.editContract(this.contract);
    this.submit.emit();
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

  updatePaidDate(): void {
    if (!this.expense.paid) this.expense.paidDate = undefined;
    else this.expense.paidDate = new Date();
  }
}
