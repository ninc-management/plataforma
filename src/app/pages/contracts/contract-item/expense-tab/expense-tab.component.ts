import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Contract, ContractExpense } from '@models/contract';
import { Invoice } from '@models/invoice';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ContractService, EXPENSE_TYPES, SPLIT_TYPES } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { cloneDeep } from 'lodash';
import { LocalDataSource } from 'ng2-smart-table';
import { BehaviorSubject, take } from 'rxjs';
import { COMPONENT_TYPES, ContractDialogComponent } from '../../contract-dialog/contract-dialog.component';

@Component({
  selector: 'ngx-expense-tab',
  templateUrl: './expense-tab.component.html',
  styleUrls: ['./expense-tab.component.scss'],
})
export class ExpenseTabComponent implements OnInit {
  @Input() iContract: Contract = new Contract();
  @Input() contract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() expenseChanged = new EventEmitter<void>();

  types = COMPONENT_TYPES;
  isEditionGranted = false;
  invoice: Invoice = new Invoice();
  source: LocalDataSource = new LocalDataSource();
  EXPENSE_OPTIONS = Object.values(EXPENSE_TYPES);
  searchQuery = '';
  comissionSum = '';

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

  constructor(
    public utils: UtilsService,
    private dialogService: NbDialogService,
    public contractService: ContractService,
    private invoiceService: InvoiceService,
    public userService: UserService,
    public stringUtil: StringUtilService
  ) {}

  ngOnInit(): void {
    if (this.contract.invoice) this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    this.contractService
      .checkEditPermission(this.invoice)
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isEditionGranted = isGranted;
        this.loadTableExpenses();
      });
  }

  openDialog(componentType: COMPONENT_TYPES, index?: number): void {
    this.isDialogBlocked.next(true);
    index = index != undefined ? index : undefined;
    const title = index != undefined ? 'ORDEM DE EMPENHO' : 'ADICIONAR ORDEM DE EMPENHO';
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
        this.loadTableExpenses();
        this.comissionSum = this.stringUtil.numberToMoney(this.contractService.getComissionsSum(this.contract));
        if (previousComissionSum != this.comissionSum) {
          this.expenseChanged.emit();
        }
        this.isDialogBlocked.next(false);
      });
  }

  confirmationDialog(index: number): void {
    this.isDialogBlocked.next(true);
    const item = 'a despesa #' + (index + 1).toString() + '?';

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
          this.contract.expenses.splice(index, 1);
          this.loadTableExpenses();
          this.expenseChanged.emit();
        }
        this.updateContract();
        this.isDialogBlocked.next(false);
      });
  }

  updateContract(): void {
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

  expenseIndex(code: 'string'): number {
    return this.contract.expenses.findIndex((expense) => expense.code == code);
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
