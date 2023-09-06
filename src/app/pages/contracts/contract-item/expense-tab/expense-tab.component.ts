import { Component, Input, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, skipWhile, take } from 'rxjs';

import { COMPONENT_TYPES, ContractDialogComponent } from '../../contract-dialog/contract-dialog.component';
import {
  DateFilterComponent,
  dateRangeFilter,
} from 'app/@theme/components/smart-table/components/filter/filter-types/date-filter.component';
import { sliderRangeFilter } from 'app/@theme/components/smart-table/components/filter/filter-types/range-slider.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import { ContractService, SPLIT_TYPES } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { formatDate, greaterAndSmallerValue, idToProperty, isPhone, valueSort } from 'app/shared/utils';

import { Contract, ContractExpense } from '@models/contract';
import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { User } from '@models/user';

@Component({
  selector: 'ngx-expense-tab',
  templateUrl: './expense-tab.component.html',
  styleUrls: ['./expense-tab.component.scss'],
})
export class ExpenseTabComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() clonedContract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);

  types = COMPONENT_TYPES;
  isEditionGranted = false;
  invoice: Invoice = new Invoice();
  source: LocalDataSource = new LocalDataSource();
  searchQuery = '';
  platformConfig: PlatformConfig = new PlatformConfig();

  get filtredExpenses(): ContractExpense[] {
    if (this.searchQuery !== '')
      return this.clonedContract.expenses.filter((expense) => {
        return (
          expense.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          expense.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          expense.type.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (expense.author &&
            idToProperty(expense.author, this.userService.idToUser.bind(this.userService), 'fullName')
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
          (expense.source &&
            idToProperty(expense.source, this.userService.idToUser.bind(this.userService), 'fullName')
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
          formatDate(expense.created).includes(this.searchQuery.toLowerCase())
        );
      });
    return this.clonedContract.expenses;
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
      source: {
        title: 'Fonte',
        type: 'string',
        valuePrepareFunction: (source: User | string | undefined) =>
          source ? this.userService.idToShortName(source) : '',
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
    public contractService: ContractService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
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

  openDialog(index?: number): void {
    this.isDialogBlocked.next(true);
    index = index != undefined ? index : undefined;
    const title = index != undefined ? 'DESPESA' : 'ADICIONAR DESPESA';

    this.dialogService
      .open(ContractDialogComponent, {
        context: {
          title: title,
          contract: this.clonedContract,
          expenseIndex: index,
          componentType: COMPONENT_TYPES.EXPENSE,
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
    const item = 'a despesa ' + this.clonedContract.expenses[index].code + '?';

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
    return this.clonedContract.expenses.findIndex((expense) => expense.code == code);
  }

  loadTableExpenses(): void {
    this.settings.actions.add = this.isEditionGranted;
    this.settings.actions.delete = this.isEditionGranted;
    this.source.load(this.clonedContract.expenses);
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
