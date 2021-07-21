import { Component, Input, OnInit } from '@angular/core';
import { cloneDeep } from 'lodash';
import { CompleterService } from 'ng2-completer';
import { take, takeUntil } from 'rxjs/operators';
import { BaseExpenseComponent } from 'app/shared/components/base-expense/base-expense.component';
import { DepartmentService } from 'app/shared/services/department.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { NORTAN, UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { NortanService } from 'app/shared/services/nortan.service';
import { Expense } from '@models/expense';
import { User } from '@models/user';
import * as expense_validation from 'app/shared/expense-validation.json';

enum NORTAN_EXPENSE_TYPES {
  DIVISAO_DE_LUCRO = 'Divisão de lucro',
  FOLHA_DE_PAGAMENTO = 'Folha de pagamento',
  REEMBOLSO = 'Reembolso',
  INVESTIMENTOS_PATRIMONIO = 'Investimentos/patrimônio',
  ADIANTAMENTO_EMPRESTIMOS = 'Adiantamento/empréstimos',
  DESPESAS = 'Despesas',
  CUSTO_OPERACIONAL = 'Custo operacional',
  GASTOS_FIXOS = 'Gastos fixos',
  IMPOSTOS = 'Impostos',
  RECEITA = 'Receita',
}

enum NORTAN_FIXED_EXPENSE_TYPES {
  ALUGUEL = 'Aluguel',
  INTERNET = 'Internet',
  ENERGIA = 'Energia',
  MARKETING = 'Marketing',
  ADMINISTRATIVO = 'Administrativo',
  OUTROS = 'Outros',
}

@Component({
  selector: 'ngx-nortan-expense-item',
  templateUrl: './nortan-expense-item.component.html',
  styleUrls: ['./nortan-expense-item.component.scss'],
})
export class NortanExpenseItemComponent
  extends BaseExpenseComponent
  implements OnInit
{
  @Input() expenseIndex?: number;
  validation = (expense_validation as any).default;
  types = Object.values(NORTAN_EXPENSE_TYPES);
  fixedTypes = Object.values(NORTAN_FIXED_EXPENSE_TYPES);
  expenseTypes = NORTAN_EXPENSE_TYPES;
  fixedExpenseTypes = NORTAN_FIXED_EXPENSE_TYPES;

  options = {
    lastValue: '0',
    lastTeam: [],
  };
  splitSelectedMember = new User();

  expense: Expense = new Expense();

  constructor(
    private nortanService: NortanService,
    protected stringUtil: StringUtilService,
    protected completerService: CompleterService,
    protected onedrive: OnedriveService,
    public userService: UserService,
    public departmentService: DepartmentService,
    public utils: UtilsService
  ) {
    super(stringUtil, completerService, onedrive, userService);
    this.expense.code = '#0';
  }

  ngOnInit(): void {
    const tmp = this.userService.getUsers().value;
    this.userData = this.completerService
      .local(cloneDeep(tmp), 'fullName', 'fullName')
      .imageField('profilePicture');
    tmp.unshift(NORTAN);
    this.sourceData = this.completerService
      .local(tmp, 'fullName', 'fullName')
      .imageField('profilePicture');
    if (this.expenseIndex != undefined) {
      // this.expense = cloneDeep(this.contract.expenses[this.expenseIndex]);
      if (this.expense.author)
        this.expense.author = this.userService.idToUser(this.expense.author);
      if (this.expense.source)
        this.expense.source = this.userService.idToUser(this.expense.source);
      this.uploadedFiles = cloneDeep(
        this.expense.uploadedFiles
      ) as UploadedFile[];
    } else {
      this.nortanService
        .expensesSize()
        .pipe(takeUntil(this.destroy$))
        .subscribe((size) => {
          this.expense.code = '#' + size.toString();
        });
      this.userService.currentUser$.pipe(take(1)).subscribe((author) => {
        this.expense.author = author;
      });
      this.updatePaidDate();
    }

    this.userSearch = this.expense.author
      ? this.userService.idToUser(this.expense.author)?.fullName
      : '';
    this.sourceSearch = this.expense.source
      ? this.userService.idToUser(this.expense.source)?.fullName
      : '';
  }

  registerExpense(): void {
    if (this.expenseIndex !== undefined) {
      this.expense.lastUpdate = new Date();
      this.nortanService.editExpense(cloneDeep(this.expense));
    } else {
      this.nortanService.saveExpense(cloneDeep(this.expense));
    }
    this.submit.emit();
  }

  addAndClean(): void {
    this.nortanService.saveExpense(cloneDeep(this.expense));
    this.sourceSearch = '';
    this.expense.source = '';
    this.expense.description = '';
    this.expense.value = '';
    this.uploadedFiles = [];
    this.expense.created = this.today;
    this.expense.lastUpdate = this.today;
    this.expense.paid = true;
  }

  handleTypeChange(): void {
    if (this.expense.type !== NORTAN_EXPENSE_TYPES.GASTOS_FIXOS)
      this.expense.fixedType = '';
  }

  updatePaidDate(): void {
    if (!this.expense.paid) this.expense.paidDate = undefined;
    else this.expense.paidDate = new Date();
  }
}
