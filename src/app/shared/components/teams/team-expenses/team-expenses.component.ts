import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Expense } from '@models/expense';
import { NbDialogService } from '@nebular/theme';
import { TeamDialogComponent, TEAM_COMPONENT_TYPES } from 'app/pages/teams/team-dialog/team-dialog.component';
import { NortanService, NORTAN_EXPENSE_TYPES } from 'app/shared/services/nortan.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { cloneDeep } from 'lodash';
import { LocalDataSource } from 'ng2-smart-table';
import { BehaviorSubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-team-expenses',
  templateUrl: './team-expenses.component.html',
  styleUrls: ['./team-expenses.component.scss'],
})
export class TeamExpensesComponent implements OnInit, OnDestroy {
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  destroy$ = new Subject<void>();
  expenses: Expense[] = [];
  source: LocalDataSource = new LocalDataSource();
  searchQuery = '';
  get filtredExpenses(): Expense[] {
    if (this.searchQuery !== '')
      return this.expenses.filter((expense) => {
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
        compareFunction: this.valueSort,
      },
      type: {
        title: 'Categoria',
        type: 'string',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: Object.values(NORTAN_EXPENSE_TYPES).map((type) => ({
              value: type,
              title: type,
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
    private nortanService: NortanService,
    private dialogService: NbDialogService,
    public userService: UserService,
    public utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.nortanService
      .getExpenses()
      .pipe(takeUntil(this.destroy$))
      .subscribe((expenses) => {
        this.expenses = expenses;
        this.source.load(
          expenses.map((expense: any) => {
            const tmp = cloneDeep(expense);
            tmp.source = this.userService.idToShortName(tmp.source);
            tmp.created = this.utils.formatDate(tmp.created);
            return tmp;
          })
        );
      });
  }

  openDialog(index?: number): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(TeamDialogComponent, {
        context: {
          title: index !== undefined ? 'EDITAR GASTO NORTAN' : 'ADICIONAR GASTO NORTAN',
          iExpense: index !== undefined ? this.expenses[index] : undefined,
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
}
