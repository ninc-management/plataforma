import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { map, take, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { cloneDeep, isEqual } from 'lodash';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { ContractService, EXPENSE_TYPES, SPLIT_TYPES, CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import { UserService, CONTRACT_BALANCE, CLIENT } from 'app/shared/services/user.service';
import { ContractDialogComponent, COMPONENT_TYPES } from '../contract-dialog/contract-dialog.component';
import { ContractExpense, Contract } from '@models/contract';
import * as contract_validation from 'app/shared/contract-validation.json';
import { User } from '@models/user';
import { Invoice, InvoiceTeamMember } from '@models/invoice';

interface ExpenseTypesSum {
  type: string;
  value: string;
}

interface ExpenseSourceSum {
  user: string;
  value: string;
}

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
  invoice: Invoice = new Invoice();
  types = COMPONENT_TYPES;
  today = new Date();
  validation = (contract_validation as any).default;
  STATOOS = Object.values(CONTRACT_STATOOS);
  INTERESTS = [...Array(24).keys()].map((index) => (index + 1).toString());
  EXPENSE_OPTIONS = Object.values(EXPENSE_TYPES);
  USER_COORDINATIONS = [] as string[];
  options = {
    liquid: '0,00',
    paid: '0,00',
    hasISS: false,
    interest: 0,
    notaFiscal: '0',
    nortanPercentage: '0',
  };
  isEditionGranted = false;
  comissionSum = '';

  get invoiceAdministration(): string {
    if (this.contract.invoice) return this.invoiceService.idToInvoice(this.contract.invoice).administration;
    return '';
  }

  get invoiceCoordination(): string {
    if (this.contract.invoice) return this.invoiceService.idToInvoice(this.contract.invoice).coordination;
    return '';
  }

  get invoiceDepartment(): string {
    if (this.contract.invoice) return this.invoiceService.idToInvoice(this.contract.invoice).department;
    return '';
  }

  teamMember: any = {};
  memberChanged$ = new BehaviorSubject<boolean>(true);
  userSearch = '';
  availableUsers: Observable<User[]> = of([]);

  searchQuery = '';
  get filtredExpenses(): ContractExpense[] {
    if (this.searchQuery !== '')
      return this.contract.expenses.filter((expense) => {
        return (
          expense.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          expense.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          expense.type.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (expense.author &&
            this.userService.idToName(expense.author).toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (expense.source &&
            this.userService.idToName(expense.source).toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          this.utils.formatDate(expense.created).includes(this.searchQuery.toLowerCase())
        );
      });
    return this.contract.expenses;
  }

  source: LocalDataSource = new LocalDataSource();
  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhuma despesa para o filtro selecionado.',
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      code: {
        title: '#',
        type: 'string',
        sortDirection: 'desc',
        width: '5%',
        compareFunction: this.itemSort,
      },
      source: {
        title: 'Fonte',
        type: 'string',
      },
      description: {
        title: 'Descrição',
        type: 'string',
      },
      value: {
        title: 'Valor',
        type: 'string',
        compareFunction: this.valueSort,
      },
      type: {
        title: 'Categoria',
        type: 'string',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: this.EXPENSE_OPTIONS.map((type) => ({
              value: type,
              title: type,
            })),
          },
        },
      },
      splitType: {
        title: 'Tipo',
        type: 'string',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: Object.values(SPLIT_TYPES).map((type) => ({
              value: type,
              title: type,
            })),
          },
        },
      },
      created: {
        title: 'Criação',
        type: 'string',
      },
      paid: {
        title: 'Pago?',
        type: 'string',
        valuePrepareFunction: (value: any) => (value ? '✅' : '❌'),
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              {
                value: true,
                title: '✅',
              },
              {
                value: false,
                title: '❌',
              },
            ],
          },
        },
      },
      paidDate: {
        title: 'Pagamento',
        valuePrepareFunction: (value?: Date): string => (value ? value.toLocaleDateString() : ''),
        type: 'string',
      },
    },
  };

  contractorIcon = {
    icon: 'client',
    pack: 'fac',
  };
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
  teamTotal = {
    grossValue: '0,00',
    netValue: '0,00',
    distribution: '0,00',
  };

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    public stringUtil: StringUtilService,
    public contractService: ContractService,
    public userService: UserService,
    public departmentService: DepartmentService,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.contract = cloneDeep(this.iContract);
    if (this.contract.invoice) this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    if (this.contract.ISS) {
      if (this.stringUtil.moneyToNumber(this.contract.ISS) == 0) this.options.hasISS = false;
      else this.options.hasISS = true;
    } else {
      this.contract.ISS = '0,00';
      this.options.hasISS = false;
    }
    this.options.interest = this.contract.receipts.length;
    this.options.notaFiscal = this.utils.nfPercentage(this.contract);
    this.options.nortanPercentage = this.utils.nortanPercentage(this.contract);
    this.updateLiquid();
    this.calculatePaidValue();
    this.calculateBalance();
    this.applyDistribution();
    this.updateTeamTotal();
    this.comissionSum = this.stringUtil.numberToMoney(this.contractService.getComissionsSum(this.contract));
    this.availableUsers = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) => {
        return users.filter((user) => {
          return this.invoice.team.find((member: InvoiceTeamMember) => this.userService.isEqual(user, member.user)) ===
            undefined
            ? true
            : false;
        });
      })
    );
    this.contractService
      .checkEditPermission(this.invoice)
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isEditionGranted = isGranted;
        this.loadTableExpenses();
      });
    this.contractService.edited$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => {
        this.contract.status = this.iContract.status;
      }, 100);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateContract(): void {
    if (!isEqual(this.iContract, this.contract)) {
      let version = +this.contract.version;
      version += 1;
      this.contract.version = version.toString().padStart(2, '0');
      this.contract.lastUpdate = new Date();
      if (this.iContract.status !== this.contract.status) {
        const lastStatusIndex = this.contract.statusHistory.length - 1;
        this.contract.statusHistory[lastStatusIndex].end = this.contract.lastUpdate;
        this.contract.statusHistory.push({
          status: this.contract.status,
          start: this.contract.lastUpdate,
        });
      }
      this.iContract = cloneDeep(this.contract);
      this.invoiceService.editInvoice(this.invoice);
      this.contractService.editContract(this.iContract);
    }
  }

  paymentDialog(componentType: COMPONENT_TYPES, index?: number): void {
    this.isDialogBlocked.next(true);
    index = index != undefined ? index : undefined;
    let title = '';
    switch (componentType) {
      case COMPONENT_TYPES.RECEIPT:
        title = index != undefined ? 'ORDEM DE EMPENHO' : 'ADICIONAR ORDEM DE EMPENHO';
        break;
      case COMPONENT_TYPES.PAYMENT:
        title = index != undefined ? 'ORDEM DE PAGAMENTO' : 'ADICIONAR ORDEM DE PAGAMENTO';
        break;
      case COMPONENT_TYPES.EXPENSE:
        title = index != undefined ? 'DESPESA' : 'ADICIONAR DESPESA';
        break;
      default:
        break;
    }

    this.dialogService
      .open(ContractDialogComponent, {
        context: {
          title: title,
          contract: this.contract,
          paymentIndex: componentType == COMPONENT_TYPES.PAYMENT ? index : undefined,
          receiptIndex: componentType == COMPONENT_TYPES.RECEIPT ? index : undefined,
          expenseIndex: componentType == COMPONENT_TYPES.EXPENSE ? index : undefined,
          componentType: componentType,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.calculatePaidValue();
        this.calculateBalance();
        if (componentType === COMPONENT_TYPES.EXPENSE) {
          this.loadTableExpenses();
          this.comissionSum = this.stringUtil.numberToMoney(this.contractService.getComissionsSum(this.contract));
        }
        this.isDialogBlocked.next(false);
      });
  }

  confirmationDialog(index: number, componentType: COMPONENT_TYPES): void {
    this.isDialogBlocked.next(true);
    let item = '';
    switch (componentType) {
      case COMPONENT_TYPES.RECEIPT:
        item = 'a ordem de empenho #' + (index + 1).toString() + '?';
        break;
      case COMPONENT_TYPES.PAYMENT:
        item = 'a ordem de pagamento #' + (index + 1).toString() + '?';
        break;
      case COMPONENT_TYPES.EXPENSE:
        item = 'a despesa #' + (index + 1).toString() + '?';
        break;
      default:
        break;
    }

    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question: 'Realmente deseja excluir ' + item,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response) => {
        if (response) {
          switch (componentType) {
            case COMPONENT_TYPES.RECEIPT:
              this.contract.receipts.splice(index, 1);
              break;
            case COMPONENT_TYPES.PAYMENT:
              this.contract.payments.splice(index, 1);
              break;
            case COMPONENT_TYPES.EXPENSE:
              this.contract.expenses.splice(index, 1);
              this.loadTableExpenses();
              break;
            default:
              break;
          }
          this.calculatePaidValue();
          this.calculateBalance();
          this.updateContract();
        }
        this.isDialogBlocked.next(false);
      });
  }

  calculatePaidValue(): void {
    this.options.interest = this.contract.receipts.length;
    this.options.notaFiscal = this.utils.nfPercentage(this.contract);
    this.options.nortanPercentage = this.utils.nortanPercentage(this.contract);
    this.updateLiquid();
    this.options.paid = this.contractService.toNetValue(
      this.stringUtil.numberToMoney(
        this.contract.receipts.reduce((accumulator: number, recipt: any) => {
          if (recipt.paid) accumulator = accumulator + this.stringUtil.moneyToNumber(recipt.value);
          return accumulator;
        }, 0)
      ),
      this.options.notaFiscal,
      this.options.nortanPercentage
    );
    this.contract.notPaid = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.contract.liquid) - this.stringUtil.moneyToNumber(this.options.paid)
    );
  }

  calculateBalance(): void {
    this.contract.balance = this.contractService.balance(this.contract);
  }

  tooltipText(): string {
    if (this.contract.invoice) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      if (invoice.contractor)
        return (
          `CPF/CNPJ: ` +
          this.contractorService.idToContractor(invoice.contractor).document +
          `\nTelefone: ` +
          this.contractorService.idToContractor(invoice.contractor).phone +
          `\nEmail: ` +
          this.contractorService.idToContractor(invoice.contractor).email +
          `\nEndereço: ` +
          this.contractorService.idToContractor(invoice.contractor).address
        );
    }
    return '';
  }

  addColaborator(): void {
    this.invoice.team.push(Object.assign({}, this.teamMember));
    this.userSearch = '';
    this.teamMember = {};
    this.updateTeamTotal();
    this.memberChanged$.next(true);
  }

  updateTeamTotal(): void {
    this.teamTotal = this.invoice.team.reduce(
      (sum, member) => {
        sum.grossValue = this.stringUtil.sumMoney(sum.grossValue, member.grossValue);
        sum.netValue = this.stringUtil.sumMoney(sum.netValue, member.netValue);
        sum.distribution = this.stringUtil.sumMoney(sum.distribution, member.distribution);
        return sum;
      },
      {
        grossValue: '0,00',
        netValue: '0,00',
        distribution: '0,00',
      }
    );
  }

  expenseTypesSum(wantsClient = false): ExpenseTypesSum[] {
    const result = this.contract.expenses.reduce(
      (sum: ExpenseTypesSum[], expense) => {
        if (
          expense.source &&
          (wantsClient
            ? this.userService.isEqual(expense.source, CLIENT._id)
            : !this.userService.isEqual(expense.source, CLIENT._id))
        ) {
          const idx = sum.findIndex((el) => el.type == expense.type);
          sum[idx].value = this.stringUtil.sumMoney(sum[idx].value, expense.value);
        }
        return sum;
      },
      this.EXPENSE_OPTIONS.map((type) => ({
        type: type,
        value: '0,00',
      }))
    );
    const total = result.reduce((sum, expense) => this.stringUtil.sumMoney(sum, expense.value), '0,00');
    result.push({ type: 'TOTAL', value: total });
    return result;
  }

  expenseSourceSum(): ExpenseSourceSum[] {
    const result = this.contract.expenses.reduce(
      (sum: ExpenseSourceSum[], expense) => {
        if (expense.source != undefined) {
          const source = this.userService.idToShortName(expense.source);
          const idx = sum.findIndex((el) => el.user == source);
          if (idx != -1) sum[idx].value = this.stringUtil.sumMoney(sum[idx].value, expense.value);
        }
        return sum;
      },
      [CONTRACT_BALANCE.fullName, CLIENT.fullName]
        .concat(
          this.invoice.team
            .map((member) => {
              if (member.user) return this.userService.idToShortName(member.user);
              return '';
            })
            .filter((n) => n.length > 0)
        )
        .map((name) => ({ user: name, value: '0,00' }))
    );
    const contractor = result.splice(1, 1)[0];
    const total = result.reduce((sum, expense) => this.stringUtil.sumMoney(sum, expense.value), '0,00');
    result.push({ user: 'TOTAL', value: total });
    result.push(contractor);
    return result;
  }

  updateLiquid(): void {
    this.contract.liquid = this.contractService.toNetValue(
      this.contractService.subtractComissions(
        this.stringUtil.removePercentage(this.contract.value, this.contract.ISS),
        this.contract
      ),
      this.options.notaFiscal,
      this.options.nortanPercentage
    );
    this.contract.cashback = this.stringUtil.numberToMoney(
      this.contractService.expensesContributions(this.contract).global.cashback
    );
  }

  updateGrossValue(idx?: number): void {
    if (idx != undefined) {
      this.invoice.team[idx].grossValue = this.contractService.toGrossValue(
        this.invoice.team[idx].netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
    } else {
      this.teamMember.grossValue = this.contractService.toGrossValue(
        this.teamMember.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
    }
  }

  updateNetValue(idx?: number, source: 'gross' | 'distribution' = 'distribution'): void {
    if (idx != undefined) {
      if (source === 'gross') {
        this.invoice.team[idx].netValue = this.contractService.toNetValue(
          this.invoice.team[idx].grossValue,
          this.options.notaFiscal,
          this.options.nortanPercentage
        );
      } else {
        this.invoice.team[idx].netValue = this.stringUtil.applyPercentage(
          this.contract.liquid,
          this.invoice.team[idx].distribution
        );
      }
      this.updateTeamTotal();
    } else {
      if (source === 'gross') {
        this.teamMember.netValue = this.contractService.toNetValue(
          this.teamMember.grossValue,
          this.options.notaFiscal,
          this.options.nortanPercentage
        );
      } else {
        this.teamMember.netValue = this.stringUtil.applyPercentage(this.contract.liquid, this.teamMember.distribution);
      }
    }
  }

  updatePercentage(idx?: number): void {
    if (idx != undefined) {
      this.invoice.team[idx].distribution = this.stringUtil
        .toPercentage(this.invoice.team[idx].netValue, this.contract.liquid, 20)
        .slice(0, -1);
      this.updateTeamTotal();
    } else {
      this.teamMember.distribution = this.stringUtil
        .toPercentage(this.teamMember.netValue, this.contract.liquid, 20)
        .slice(0, -1);
    }
  }

  valueSort(direction: number, a: string, b: string): number {
    const first = +a.replace(/[,.]/g, '');
    const second = +b.replace(/[,.]/g, '');

    if (first < second) {
      return -1 * direction;
    }
    if (first > second) {
      return direction;
    }
    return 0;
  }

  itemSort(direction: number, a: string, b: string): number {
    const first = +a.replace(/[#]/g, '');
    const second = +b.replace(/[#]/g, '');

    if (first < second) {
      return -1 * direction;
    }
    if (first > second) {
      return direction;
    }
    return 0;
  }

  loadTableExpenses(): void {
    this.settings.actions.add = this.isEditionGranted;
    this.settings.actions.delete = this.isEditionGranted;
    this.source.load(
      this.contract.expenses.map((expense: any, index: number) => {
        const tmp = cloneDeep(expense);
        tmp.source = this.userService.idToShortName(tmp.source);
        tmp.created = this.utils.formatDate(tmp.created);
        return tmp;
      })
    );
  }

  expenseIndex(code: 'string'): number {
    return this.contract.expenses.findIndex((expense) => expense.code == code);
  }

  isGrossValueOK(): boolean {
    return (
      this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(this.teamTotal.grossValue) + this.contractService.getComissionsSum(this.contract)
      ) === this.stringUtil.removePercentage(this.contract.value, this.contract.ISS) &&
      this.teamTotal.grossValue !== '0,00'
    );
  }

  isNetValueOK(): boolean {
    return (
      this.teamTotal.netValue ===
        this.stringUtil.sumMoney(
          this.contract.liquid,
          this.stringUtil.numberToMoney(this.contractService.expensesContributions(this.contract).global.cashback)
        ) && this.teamTotal.netValue !== '0,00'
    );
  }

  applyDistribution(): void {
    this.invoice.team = this.invoice.team.map((member) => {
      member.netValue = this.stringUtil.applyPercentage(this.contract.liquid, member.distribution);
      member.grossValue = this.contractService.toGrossValue(
        member.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
      return member;
    });
  }

  canRemoveMember(index: number): boolean {
    const user = this.invoice.team[index].user;
    if (this.stringUtil.moneyToNumber(this.contractService.receivedValue(user, this.contract)) > 0) {
      return false;
    }
    if (this.stringUtil.moneyToNumber(this.contractService.getMemberExpensesSum(user, this.contract)) > 0) {
      return false;
    }
    if (!!this.contract.expenses.find((expense) => expense.paid && this.userService.isEqual(expense.source, user))) {
      return false;
    }
    return true;
  }
}
