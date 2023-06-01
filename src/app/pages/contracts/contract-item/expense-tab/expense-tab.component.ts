import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, merge, skipWhile, Subject, take, takeUntil } from 'rxjs';

import { COMPONENT_TYPES } from '../../contract-dialog/contract-dialog.component';
import {
  DateFilterComponent,
  dateRangeFilter,
} from 'app/@theme/components/smart-table/components/filter/filter-types/date-filter.component';
import { sliderRangeFilter } from 'app/@theme/components/smart-table/components/filter/filter-types/range-slider.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { TransactionDialogComponent } from 'app/shared/components/transactions/transaction-dialog/transaction-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { TeamService } from 'app/shared/services/team.service';
import { TransactionService } from 'app/shared/services/transaction.service';
import { UserService } from 'app/shared/services/user.service';
import { formatDate, greaterAndSmallerValue, idToProperty, isPhone, nameSort, valueSort } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { Team } from '@models/team';
import { Transaction } from '@models/transaction';
import { User } from '@models/user';

@Component({
  selector: 'ngx-expense-tab',
  templateUrl: './expense-tab.component.html',
  styleUrls: ['./expense-tab.component.scss'],
})
export class ExpenseTabComponent implements OnInit, OnDestroy {
  @Input() contract: Contract = new Contract();
  @Input() clonedContract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  destroy$ = new Subject<void>();

  types = COMPONENT_TYPES;
  isEditionGranted = false;
  invoice: Invoice = new Invoice();
  source: LocalDataSource = new LocalDataSource();
  searchQuery = '';
  platformConfig: PlatformConfig = new PlatformConfig();

  get filtredExpenses(): Transaction[] {
    const filtredExpenses = this.clonedContract.expenses
      .filter((expenseRef): expenseRef is Transaction | string => expenseRef != undefined)
      .map((expenseRef) => this.transactionService.idToTransaction(expenseRef));
    if (this.searchQuery !== '')
      return filtredExpenses.filter((expense) => {
        return (
          expense.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          expense.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          expense.type.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (expense.author &&
            idToProperty(expense.author, this.userService.idToUser.bind(this.userService), 'name')
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
          this.transactionService
            .populateCostCenter(
              expense,
              this.teamService.idToTeam.bind(this.teamService),
              this.userService.idToUser.bind(this.userService)
            )
            .name.toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          formatDate(expense.created).includes(this.searchQuery.toLowerCase())
        );
      });
    return filtredExpenses;
  }
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
      costCenter: {
        title: 'Centro de Custo',
        type: 'string',
        width: '10%',
        valuePrepareFunction: (costCenter: User | Team | string | undefined) => {
          return (costCenter as User | Team).name;
        },
        compareFunction: (
          direction: number,
          a: User | Team | string | undefined,
          b: User | Team | string | undefined
        ) => {
          return nameSort(direction, (a as User | Team).name, (b as User | Team).name);
        },
        filterFunction: (costCenter: User | Team | string | undefined, search?: string): boolean => {
          if (search && (costCenter as User | Team).name.includes(search)) return true;
          return false;
        },
      },
      description: {
        title: 'Descrição',
        type: 'string',
      },
      value: {
        title: 'Valor',
        type: 'string',
        filter: {
          type: 'slider',
          config: {
            minValue: 0,
            maxValue: 0,
          },
        },
        compareFunction: valueSort,
        filterFunction: (cell: any, search?: string) => sliderRangeFilter(cell, search),
      },
      type: {
        title: 'Categoria',
        type: 'string',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [] as any[],
          },
        },
      },
      created: {
        title: 'Criação',
        type: 'string',
        filter: {
          type: 'date',
          component: DateFilterComponent,
        },
        valuePrepareFunction: (date: Date) => formatDate(date) as any,
        filterFunction: (cell: any, search?: string) => dateRangeFilter(cell, search),
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
        filter: {
          type: 'date',
          component: DateFilterComponent,
        },
        valuePrepareFunction: (date: Date) => formatDate(date) as any,
        filterFunction: (cell: any, search?: string) => dateRangeFilter(cell, search),
      },
    },
  };

  isPhone = isPhone;
  idToProperty = idToProperty;
  formatDate = formatDate;

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private configService: ConfigService,
    private transactionService: TransactionService,
    private teamService: TeamService,
    public contractService: ContractService,
    public userService: UserService,
    public stringUtil: StringUtilService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    merge(this.contractService.edited$, this.transactionService.edited$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTableExpenses());

    if (this.clonedContract.invoice) this.invoice = this.invoiceService.idToInvoice(this.clonedContract.invoice);
    //INVARIANT: The config service data must be loaded for the code to be synchronous
    combineLatest([
      this.contractService.checkEditPermission(this.invoice),
      this.configService.getConfig(),
      this.configService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(([, , isLoaded]) => !isLoaded),
        take(1)
      )
      .subscribe(([isGranted, configs, _]) => {
        this.isEditionGranted = isGranted;
        this.loadTableExpenses();
        this.platformConfig = configs[0];
        this.reloadTableSettings();
      });
  }

  openDialog(event: { data?: any }): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(TransactionDialogComponent, {
        context: {
          title: event.data ? (isPhone() ? 'EDIÇÃO' : 'EDITAR MOVIMENTAÇÃO') : 'ADICIONAR MOVIMENTAÇÃO',
          transaction: event.data ? event.data : new Transaction(),
          contract: this.contract,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.loadTableExpenses();
        this.clonedContract.locals.balance = this.contractService.balance(this.clonedContract);
        this.isDialogBlocked.next(false);
      });
  }

  confirmationDialog(index: number): void {
    this.isDialogBlocked.next(true);
    const item =
      'a despesa ' +
      idToProperty(
        this.clonedContract.expenses[index],
        this.transactionService.idToTransaction.bind(this.userService),
        'code'
      ) +
      '?';

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
          this.clonedContract.expenses.splice(index, 1);
          this.loadTableExpenses();
        }
        this.updateContract();
        this.isDialogBlocked.next(false);
      });
  }

  updateContract(): void {
    let version = +this.clonedContract.version;
    version += 1;
    this.clonedContract.version = version.toString().padStart(2, '0');
    this.clonedContract.lastUpdate = new Date();
    if (this.contract.status !== this.clonedContract.status) {
      const lastStatusIndex = this.clonedContract.statusHistory.length - 1;
      this.clonedContract.statusHistory[lastStatusIndex].end = this.clonedContract.lastUpdate;
      this.clonedContract.statusHistory.push({
        status: this.clonedContract.status,
        start: this.clonedContract.lastUpdate,
      });
    }
    this.contract = cloneDeep(this.clonedContract);
    this.invoiceService.editInvoice(this.invoice);
    this.contractService.editContract(this.contract);
  }

  expenseIndex(code: 'string'): number {
    return this.clonedContract.expenses.findIndex(
      (expense) => idToProperty(expense, this.transactionService.idToTransaction.bind(this.userService), 'code') == code
    );
  }

  loadTableExpenses(): void {
    this.settings.actions.add = this.isEditionGranted;
    this.settings.actions.delete = this.isEditionGranted;
    this.source.load(
      this.contract.expenses
        .filter((expenseRef): expenseRef is Transaction | string => expenseRef != undefined)
        .map((expenseRef) => {
          const expense = this.transactionService.idToTransaction(expenseRef);
          expense.costCenter = this.transactionService.populateCostCenter(
            expense,
            this.teamService.idToTeam.bind(this.teamService),
            this.userService.idToUser.bind(this.userService)
          );
          return expense;
        })
    );
    const expensesValues = greaterAndSmallerValue(this.clonedContract.expenses);
    this.settings.columns.value.filter.config.minValue = expensesValues.min;
    this.settings.columns.value.filter.config.maxValue = expensesValues.max;
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

  reloadTableSettings(): void {
    const newSettings = this.settings;
    newSettings.columns.type.filter.config.list = this.platformConfig.expenseConfig.contractExpenseTypes.map(
      (type) => ({
        value: type.name,
        title: type.name,
      })
    );
    this.settings = Object.assign({}, newSettings);
  }
}
