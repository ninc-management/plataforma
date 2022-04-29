import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { take, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { cloneDeep, isEqual } from 'lodash';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ContractService, EXPENSE_TYPES, SPLIT_TYPES } from 'app/shared/services/contract.service';
import { UserService } from 'app/shared/services/user.service';
import { ContractDialogComponent, COMPONENT_TYPES } from '../contract-dialog/contract-dialog.component';
import { ContractExpense, Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { TeamService } from 'app/shared/services/team.service';
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
  invoice: Invoice = new Invoice();
  types = COMPONENT_TYPES;
  responseEvent = new Subject<void>();
  EXPENSE_OPTIONS = Object.values(EXPENSE_TYPES);
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

  teamMember: any = {};
  memberChanged$ = new BehaviorSubject<boolean>(true);

  searchQuery = '';
  get filtredExpenses(): ContractExpense[] {
    if (this.searchQuery !== '')
      return this.contract.expenses.filter((expense) => {
        return (
          expense.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          expense.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          expense.type.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (expense.author &&
            this.utils
              .idToProperty(expense.author, this.userService.idToUser.bind(this.userService), 'fullName')
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
          (expense.source &&
            this.utils
              .idToProperty(expense.source, this.userService.idToUser.bind(this.userService), 'fullName')
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
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
        compareFunction: this.utils.valueSort,
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
        type: 'string',
      },
    },
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
    public stringUtil: StringUtilService,
    public contractService: ContractService,
    public userService: UserService,
    public utils: UtilsService,
    public teamService: TeamService
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
    this.updateLiquid();
    this.calculatePaidValue();
    this.calculateBalance();
    this.updateTeamTotal();
    this.comissionSum = this.stringUtil.numberToMoney(this.contractService.getComissionsSum(this.contract));
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
      case COMPONENT_TYPES.EXPENSE:
        title = index != undefined ? 'DESPESA' : 'ADICIONAR DESPESA';
        break;
      default:
        break;
    }

    const previousComissionSum = this.comissionSum;
    this.dialogService
      .open(ContractDialogComponent, {
        context: {
          title: title,
          contract: this.contract,
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
          if (previousComissionSum != this.comissionSum) {
            this.updateLiquid();
          }
        }
        this.isDialogBlocked.next(false);
      });
  }

  confirmationDialog(index: number, componentType: COMPONENT_TYPES): void {
    this.isDialogBlocked.next(true);
    let item = '';
    switch (componentType) {
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
    this.options.paid = this.contractService.paidValue(this.contract);
    this.contract.notPaid = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(
        this.contractService.toNetValue(
          this.contract.value,
          this.options.notaFiscal,
          this.options.nortanPercentage,
          this.contract.created
        )
      ) - this.stringUtil.moneyToNumber(this.options.paid)
    );
  }

  calculateBalance(): void {
    this.contract.balance = this.contractService.balance(this.contract);
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

  updateLiquid(): void {
    this.contract.liquid = this.contractService.toNetValue(
      this.contractService.subtractComissions(
        this.stringUtil.removePercentage(this.contract.value, this.contract.ISS),
        this.contract
      ),
      this.options.notaFiscal,
      this.options.nortanPercentage,
      this.contract.created
    );
    this.contract.cashback = this.stringUtil.numberToMoney(
      this.contractService.expensesContributions(this.contract).global.cashback
    );
    if (this.contract.invoice != undefined) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      invoice.team.map((member, index) => {
        member.netValue = this.stringUtil.applyPercentage(this.contract.liquid, member.distribution);
        this.updateGrossValue(index);
        this.updateTeamTotal();
      });
    }
  }

  updateGrossValue(idx?: number): void {
    if (idx != undefined) {
      this.invoice.team[idx].grossValue = this.contractService.toGrossValue(
        this.invoice.team[idx].netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
      this.updateTeamTotal();
    } else {
      this.teamMember.grossValue = this.contractService.toGrossValue(
        this.teamMember.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
    }
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
        tmp.paidDate = this.utils.formatDate(tmp.paidDate);
        return tmp;
      })
    );
  }

  expenseIndex(code: 'string'): number {
    return this.contract.expenses.findIndex((expense) => expense.code == code);
  }

  forwardRespose() {
    this.responseEvent.next();
  }
}
