import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { cloneDeep } from 'lodash';
import { skip, take, takeUntil } from 'rxjs/operators';
import { BaseExpenseComponent } from 'app/shared/components/base-expense/base-expense.component';
import { DepartmentService } from 'app/shared/services/department.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { NORTAN, UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { NortanService, NORTAN_EXPENSE_TYPES, NORTAN_FIXED_EXPENSE_TYPES } from 'app/shared/services/nortan.service';
import { Expense } from '@models/expense';
import { User } from '@models/user';
import * as expense_validation from 'app/shared/expense-validation.json';
import { NgForm } from '@angular/forms';
import { of } from 'rxjs/internal/observable/of';

@Component({
  selector: 'ngx-nortan-expense-item',
  templateUrl: './nortan-expense-item.component.html',
  styleUrls: ['./nortan-expense-item.component.scss'],
})
export class NortanExpenseItemComponent extends BaseExpenseComponent implements OnInit {
  @ViewChild('form', { static: true })
  formRef!: NgForm;
  @Input() iExpense?: Expense;
  validation = (expense_validation as any).default;
  types = Object.values(NORTAN_EXPENSE_TYPES).sort();
  fixedTypes = Object.values(NORTAN_FIXED_EXPENSE_TYPES).sort();
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
    protected onedrive: OnedriveService,
    public userService: UserService,
    public departmentService: DepartmentService,
    public utils: UtilsService
  ) {
    super(stringUtil, onedrive, userService);
    this.expense.code = '#0';
  }

  ngOnInit(): void {
    super.ngOnInit();

    const tmp = cloneDeep(this.userService.getUsers().value);
    this.userData = of(cloneDeep(tmp));
    tmp.unshift(NORTAN);
    this.sourceData = of(tmp);
    if (this.iExpense != undefined) {
      this.expense = cloneDeep(this.iExpense);
      if (this.expense.author) this.expense.author = this.userService.idToUser(this.expense.author);
      if (this.expense.source) this.expense.source = this.userService.idToUser(this.expense.source);
      this.uploadedFiles = cloneDeep(this.expense.uploadedFiles) as UploadedFile[];
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

    this.userSearch = this.expense.author ? this.userService.idToUser(this.expense.author)?.fullName : '';
    this.sourceSearch = this.expense.source ? this.userService.idToUser(this.expense.source)?.fullName : '';

    this.formRef.control.statusChanges.pipe(skip(1), takeUntil(this.destroy$)).subscribe((status) => {
      if (status === 'VALID' && this.expense.nf === true)
        setTimeout(() => {
          this.updateUploaderOptions();
        }, 5);
    });
  }

  registerExpense(): void {
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
    if (this.iExpense !== undefined) {
      this.expense.lastUpdate = new Date();
      this.nortanService.editExpense(cloneDeep(this.expense));
    } else {
      this.nortanService.saveExpense(cloneDeep(this.expense));
    }
    this.submit.emit();
  }

  addAndClean(): void {
    this.expense.uploadedFiles = cloneDeep(this.uploadedFiles);
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

  updateUploaderOptions(): void {
    const mediaFolderPath = this.onedrive.generateNortanExpensesPath(this.expense);
    const fn = (name: string) => {
      const type = this.expense.type;
      const date = this.utils.formatDate(new Date(), '-');
      const extension = name.match('[.].+');
      if (this.expense.type === NORTAN_EXPENSE_TYPES.GASTOS_FIXOS) {
        const subType = this.expense.fixedType;
        return 'Comprovante-' + type + '-' + subType + '-' + date + extension;
      }
      return 'Comprovante-' + type + '-' + date + extension;
    };
    super.updateUploaderOptions(mediaFolderPath, fn, true);
  }

  handleTypeChange(): void {
    if (this.expense.type !== NORTAN_EXPENSE_TYPES.GASTOS_FIXOS) this.expense.fixedType = '';
  }

  updatePaidDate(): void {
    if (!this.expense.paid) this.expense.paidDate = undefined;
    else this.expense.paidDate = new Date();
  }
}
