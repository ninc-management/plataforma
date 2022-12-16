import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';

import { TransactionDialogComponent } from '../../transactions/transaction-dialog/transaction-dialog.component';
import {
  DateFilterComponent,
  dateRangeFilter,
} from 'app/@theme/components/smart-table/components/filter/filter-types/date-filter.component';
import { sliderRangeFilter } from 'app/@theme/components/smart-table/components/filter/filter-types/range-slider.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ConfigService } from 'app/shared/services/config.service';
import { TeamService } from 'app/shared/services/team.service';
import { TransactionService } from 'app/shared/services/transaction.service';
import { UserService } from 'app/shared/services/user.service';
import { formatDate, greaterAndSmallerValue, idToProperty, isPhone, populateList, valueSort } from 'app/shared/utils';

import { PlatformConfig } from '@models/platformConfig';
import { Team } from '@models/team';
import { Transaction } from '@models/transaction';
import { User } from '@models/user';

@Component({
  selector: 'ngx-team-expenses',
  templateUrl: './team-expenses.component.html',
  styleUrls: ['./team-expenses.component.scss'],
})
export class TeamExpensesComponent implements OnInit, OnDestroy {
  @Input() clonedTeam: Team = new Team();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  destroy$ = new Subject<void>();
  expenses: Transaction[] = [];
  source: LocalDataSource = new LocalDataSource();
  searchQuery = '';
  platformConfig: PlatformConfig = new PlatformConfig();
  isDataLoaded = false;

  isPhone = isPhone;
  formatDate = formatDate;
  idToProperty = idToProperty;

  get filtredExpenses(): Transaction[] {
    //TODO: NINC-2106
    if (this.searchQuery !== '')
      return this.clonedTeam.expenses
        .filter((expense): expense is NonNullable<Transaction | string | undefined> => expense !== undefined)
        .map((expense) => this.transactionService.idToTransaction(expense))
        .filter((expense) => {
          return (
            expense.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            expense.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            expense.type.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            (expense.author &&
              idToProperty(expense.author, this.userService.idToUser.bind(this.userService), 'name')
                .toLowerCase()
                .includes(this.searchQuery.toLowerCase())) ||
            (expense.costCenter &&
              idToProperty(expense, this.transactionService.populateCostCenter.bind(this.transactionService), 'name')
                .toLowerCase()
                .includes(this.searchQuery.toLowerCase())) ||
            formatDate(expense.created).includes(this.searchQuery.toLowerCase())
          );
        }) as Transaction[];
    return this.clonedTeam.expenses
      .filter((expense): expense is NonNullable<Transaction | string | undefined> => expense !== undefined)
      .map((expense) => this.transactionService.idToTransaction(expense));
  }

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum gasto para o filtro selecionado.',
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
      delete: false,
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
      created: {
        title: 'Data',
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
    },
  };

  constructor(
    private dialogService: NbDialogService,
    private teamService: TeamService,
    private configService: ConfigService,
    private transactionService: TransactionService,
    public userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //INVARIANT: The settings object must be filled before the ngAfterViewInit cycle
  ngOnInit(): void {
    combineLatest([
      this.teamService.getTeams(),
      this.configService.getConfig(),
      this.transactionService.getTransactions(),
      this.userService.getUsers(),
      this.teamService.isDataLoaded$,
      this.configService.isDataLoaded$,
      this.transactionService.isDataLoaded$,
      this.userService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([, , , , isTeamLoaded, isConfigLoaded, isTransactionLoaded, isUserLoaded]) =>
            !isTeamLoaded || !isConfigLoaded || !isTransactionLoaded || !isUserLoaded
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([teams, configs, , , , , ,]) => {
        this.platformConfig = configs[0];
        this.loadTableExpenses();
        this.reloadTableSettings();
        const tmp = teams.find((team) => team._id === this.clonedTeam._id);
        this.clonedTeam = tmp ? tmp : new Team();
        this.expenses = populateList(
          this.clonedTeam.expenses,
          this.transactionService.idToTransaction.bind(this.transactionService)
        );
        this.source.load(
          this.expenses.map((expense) => {
            const tmp = cloneDeep(expense) as any;
            tmp.costCenter = this.transactionService.populateCostCenter(
              tmp,
              this.teamService.idToTeam.bind(this.teamService),
              this.userService.idToUser.bind(this.userService)
            );
            tmp.costCenter = tmp.costCenter.name;
            tmp.created = formatDate(tmp.created);
            return tmp;
          })
        );
      });
  }

  openDialog(event: { data?: Transaction }): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(TransactionDialogComponent, {
        context: {
          title: event.data ? (isPhone() ? 'EDIÇÃO' : 'EDITAR MOVIMENTAÇÃO') : 'ADICIONAR MOVIMENTAÇÃO',
          transaction: event.data ? event.data : new Transaction(),
          team: this.clonedTeam,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.isDialogBlocked.next(false);
      });
  }

  expenseIndex(code: string): number {
    return this.clonedTeam.expenses
      .filter((expense): expense is NonNullable<Transaction | string | undefined> => expense !== undefined)
      .findIndex((expense) => this.transactionService.idToTransaction(expense).code == code);
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
    this.source.load(this.clonedTeam.expenses);
    const expensesValues = greaterAndSmallerValue(this.clonedTeam.expenses);
    this.settings.columns.value.filter.config.minValue = expensesValues.min;
    this.settings.columns.value.filter.config.maxValue = expensesValues.max;
  }

  reloadTableSettings(): void {
    const newSettings = this.settings;
    newSettings.columns.type.filter.config.list = this.platformConfig.expenseConfig.adminExpenseTypes.map((type) => ({
      value: type.name,
      title: type.name,
    }));
    this.settings = Object.assign({}, newSettings);
  }
}
