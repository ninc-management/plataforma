import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Contract, ContractExpense } from '@models/contract';
import { Invoice } from '@models/invoice';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ContractService, EXPENSE_TYPES, SPLIT_TYPES } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { cloneDeep } from 'lodash';
import { LocalDataSource } from 'ng2-smart-table';
import { BehaviorSubject, take } from 'rxjs';
import { COMPONENT_TYPES, ContractDialogComponent } from '../../contract-dialog/contract-dialog.component';
import { isPhone, formatDate, idToProperty, valueSort } from 'app/shared/utils';

@Component({
  selector: 'ngx-expense-tab',
  templateUrl: './expense-tab.component.html',
  styleUrls: ['./expense-tab.component.scss'],
})
export class ExpenseTabComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() clonedContract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() expensesChanged = new EventEmitter<void>();

  types = COMPONENT_TYPES;
  isEditionGranted = false;
  invoice: Invoice = new Invoice();
  source: LocalDataSource = new LocalDataSource();
  EXPENSE_OPTIONS = Object.values(EXPENSE_TYPES);
  searchQuery = '';
  comissionSum = '';

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

  isPhone = isPhone;
  idToProperty = idToProperty;
  formatDate = formatDate;

  constructor(
    private dialogService: NbDialogService,
    public contractService: ContractService,
    private invoiceService: InvoiceService,
    public userService: UserService,
    public stringUtil: StringUtilService
  ) {}

  ngOnInit(): void {
    if (this.clonedContract.invoice) this.invoice = this.invoiceService.idToInvoice(this.clonedContract.invoice);
    this.contractService
      .checkEditPermission(this.invoice)
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isEditionGranted = isGranted;
        this.loadTableExpenses();
      });
  }

  openDialog(index?: number): void {
    this.isDialogBlocked.next(true);
    index = index != undefined ? index : undefined;
    const title = index != undefined ? 'DESPESA' : 'ADICIONAR DESPESA';
    const previousComissionSum = this.comissionSum;

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
        this.comissionSum = this.stringUtil.numberToMoney(this.contractService.getComissionsSum(this.clonedContract));
        if (previousComissionSum != this.comissionSum) {
          this.expensesChanged.emit();
        }
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
          this.expensesChanged.emit();
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
    this.source.load(
      this.clonedContract.expenses.map((expense: any, index: number) => {
        const tmp = cloneDeep(expense);
        tmp.source = this.userService.idToShortName(tmp.source);
        tmp.created = formatDate(tmp.created);
        tmp.paidDate = tmp.paid ? formatDate(tmp.paidDate) : '';
        return tmp;
      })
    );
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
