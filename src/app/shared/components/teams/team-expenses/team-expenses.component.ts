import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PlatformConfig } from '@models/platformConfig';
import { Team, TeamExpense } from '@models/team';
import { NbDialogService } from '@nebular/theme';
import { TeamDialogComponent, TEAM_COMPONENT_TYPES } from 'app/pages/teams/team-dialog/team-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { cloneDeep } from 'lodash';
import { LocalDataSource } from 'ng2-smart-table';
import { BehaviorSubject, Subject } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';
import { isPhone, idToProperty, formatDate, valueSort } from 'app/shared/utils';

@Component({
  selector: 'ngx-team-expenses',
  templateUrl: './team-expenses.component.html',
  styleUrls: ['./team-expenses.component.scss'],
})
export class TeamExpensesComponent implements OnInit, OnDestroy {
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() iTeam: string = '';
  destroy$ = new Subject<void>();
  expenses: TeamExpense[] = [];
  source: LocalDataSource = new LocalDataSource();
  searchQuery = '';
  team: Team = new Team();
  platformConfig: PlatformConfig = new PlatformConfig();

  isPhone = isPhone;
  formatDate = formatDate;
  idToProperty = idToProperty;

  get filtredExpenses(): TeamExpense[] {
    if (this.searchQuery !== '')
      return this.expenses.filter((expense) => {
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
    return this.expenses;
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
      },
      description: {
        title: 'Descrição',
        type: 'string',
      },
      value: {
        title: 'Valor',
        type: 'string',
        compareFunction: valueSort,
      },
      type: {
        title: 'Categoria',
        type: 'string',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: this.platformConfig.expenseConfig.adminExpenses.map((type) => ({
              value: type.name,
              title: type.name,
            })),
          },
        },
      },
      created: {
        title: 'Data',
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
    },
  };

  constructor(
    private dialogService: NbDialogService,
    private teamService: TeamService,
    private configService: ConfigService,
    public userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //INVARIANT: The settings object must be filled before the ngAfterViewInit cycle
  ngOnInit(): void {
    this.teamService
      .getTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe((teams) => {
        const tmp = teams.find((team) => team._id === this.iTeam);
        this.team = tmp ? tmp : new Team();
        this.expenses = cloneDeep(this.team.expenses);
        this.source.load(
          this.expenses.map((expense: any) => {
            const tmp = cloneDeep(expense);
            tmp.source = this.userService.idToShortName(tmp.source);
            tmp.created = formatDate(tmp.created);
            return tmp;
          })
        );
      });

    //INVARIANT: The config service data must be loaded for the code to be synchronous
    this.configService
      .getConfig()
      .pipe(
        skipWhile((config) => config.length == 0),
        takeUntil(this.destroy$)
      )
      .subscribe((config) => {
        this.platformConfig = config[0];
        this.reloadTableSettings();
      });
  }

  openDialog(index?: number): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(TeamDialogComponent, {
        context: {
          title: index !== undefined ? 'EDITAR MOVIMENTAÇÃO' : 'ADICIONAR MOVIMENTAÇÃO',
          iTeam: this.team,
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
    return this.expenses.findIndex((expense) => expense.code == code);
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
    newSettings.columns.type.filter.config.list = this.platformConfig.expenseConfig.adminExpenses.map((type) => ({
      value: type.name,
      title: type.name,
    }));
    this.settings = Object.assign({}, newSettings);
  }
}
