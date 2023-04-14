import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';

import {
  DateFilterComponent,
  dateRangeFilter,
} from 'app/@theme/components/smart-table/components/filter/filter-types/date-filter.component';
import { sliderRangeFilter } from 'app/@theme/components/smart-table/components/filter/filter-types/range-slider.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { TEAM_COMPONENT_TYPES, TeamDialogComponent } from 'app/pages/teams/team-dialog/team-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import { UserService } from 'app/shared/services/user.service';
import { formatDate, greaterAndSmallerValue, idToProperty, isPhone, valueSort } from 'app/shared/utils';

import { PlatformConfig } from '@models/platformConfig';
import { Team, TeamExpense } from '@models/team';
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
  source: LocalDataSource = new LocalDataSource();
  searchQuery = '';
  platformConfig: PlatformConfig = new PlatformConfig();
  isDataLoaded = false;

  isPhone = isPhone;
  formatDate = formatDate;
  idToProperty = idToProperty;

  get filtredExpenses(): TeamExpense[] {
    if (this.searchQuery !== '')
      return this.clonedTeam.expenses.filter((expense) => {
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
    return this.clonedTeam.expenses;
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
    private configService: ConfigService,
    public userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //INVARIANT: The settings object must be filled before the ngAfterViewInit cycle
  ngOnInit(): void {
    combineLatest([this.configService.getConfig(), this.configService.isDataLoaded$])
      .pipe(
        skipWhile(([, isConfigLoaded]) => !isConfigLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([configs]) => {
        this.platformConfig = configs[0];
        this.loadTableExpenses();
        this.reloadTableSettings();
      });
  }

  openDialog(index?: number): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(TeamDialogComponent, {
        context: {
          title: index !== undefined ? 'EDITAR MOVIMENTAÇÃO' : 'ADICIONAR MOVIMENTAÇÃO',
          iTeam: this.clonedTeam,
          expenseIdx: index,
          componentType: TEAM_COMPONENT_TYPES.EXPENSE,
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
    return this.clonedTeam.expenses.findIndex((expense) => expense.code == code);
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
