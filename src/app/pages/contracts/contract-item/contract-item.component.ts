import { Component, OnInit, Input } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { CompleterService, CompleterData } from 'ng2-completer';
import { format } from 'date-fns';
import { LocalDataSource } from 'ng2-smart-table';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { cloneDeep } from 'lodash';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import {
  ContractService,
  EXPENSE_TYPES,
  SPLIT_TYPES,
} from 'app/shared/services/contract.service';
import {
  UserService,
  CONTRACT_BALANCE,
} from 'app/shared/services/user.service';
import {
  ContractDialogComponent,
  ComponentTypes,
} from '../contract-dialog/contract-dialog.component';
import {
  ContractExpense,
  Contract,
} from '../../../../../backend/src/models/contract';
import { User } from '../../../../../backend/src/models/user';
import * as contract_validation from 'app/shared/contract-validation.json';

export enum CONTRACT_STATOOS {
  EM_ANDAMENTO = 'Em andamento',
  A_RECEBER = 'A receber',
  CONCLUIDO = 'Concluído',
  ARQUIVADO = 'Arquivado',
}

interface ExpenseTypesSum {
  type: string;
  value: string;
}

interface ExpenseSourceSum {
  user: string;
  value: string;
}

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
})
export class ContractItemComponent implements OnInit {
  @Input() iContract = new Contract();
  @Input() index?: number;
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  contract: Contract = new Contract();
  types = ComponentTypes;
  today = new Date();
  validation = (contract_validation as any).default;
  STATOOS = Object.values(CONTRACT_STATOOS);
  INTERESTS = [...Array(24).keys()].map((index) => (index + 1).toString());
  EXPENSE_OPTIONS = Object.values(EXPENSE_TYPES);
  USER_COORDINATIONS = [] as string[];
  options = {
    liquid: '0,00',
    paid: '0,00',
    hasISS: false,
    interest: 0,
    notaFiscal: '0',
    nortanPercentage: '0',
  };

  get invoiceAdministration(): string {
    if (this.contract.invoice)
      return this.invoiceService.idToInvoice(this.contract.invoice)
        .administration;
    return '';
  }

  get invoiceCoordination(): string {
    if (this.contract.invoice)
      return this.invoiceService.idToInvoice(this.contract.invoice)
        .coordination;
    return '';
  }

  get invoiceDepartment(): string {
    if (this.contract.invoice)
      return this.invoiceService.idToInvoice(this.contract.invoice).department;
    return '';
  }

  teamMember: any = {};
  userSearch = '';
  userData: CompleterData = this.completerService.local([]);

  searchQuery = '';
  get filtredExpenses(): ContractExpense[] {
    if (this.searchQuery !== '')
      return this.contract.expenses.filter((expense) => {
        return (
          expense.description
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          expense.value
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          expense.type.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (expense.author &&
            this.userService
              .idToName(expense.author)
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
          (expense.source &&
            this.userService
              .idToName(expense.source)
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
          format(expense.created, 'dd/MM/yyyy').includes(
            this.searchQuery.toLowerCase()
          )
        );
      });
    return this.contract.expenses;
  }

  source: LocalDataSource = new LocalDataSource();
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
      number: {
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
        title: 'Data',
        type: 'string',
      },
    },
  };

  paymentIcon = {
    icon: 'dollar-sign',
    pack: 'fa',
  };
  receiptIcon = {
    icon: 'receipt',
    pack: 'fac',
  };
  expenseIcon = {
    icon: 'minus',
    pack: 'fac',
  };
  scaleIcon = {
    icon: 'scale',
    pack: 'fac',
  };
  teamTotal = {
    grossValue: '0,00',
    netValue: '0,00',
    distribution: '0,00',
  };

  constructor(
    private dialogService: NbDialogService,
    private completerService: CompleterService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    public stringUtil: StringUtilService,
    public contractService: ContractService,
    public userService: UserService,
    public departmentService: DepartmentService,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.contract = cloneDeep(this.iContract);
    if (this.contract.ISS) {
      if (this.stringUtil.moneyToNumber(this.contract.ISS) == 0)
        this.options.hasISS = false;
      else this.options.hasISS = true;
    } else {
      this.contract.ISS = '0,00';
      this.options.hasISS = false;
    }
    this.options.interest = this.contract.receipts.length;
    this.options.notaFiscal = this.utils.nfPercentage(this.contract);
    this.options.nortanPercentage = this.utils.nortanPercentage(this.contract);
    this.updateLiquid();
    this.calculatePaidValue();
    this.calculateBalance();
    if (
      this.contract.invoice &&
      (!this.contract.team || this.contract.team?.length == 0)
    ) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      if (invoice.team) {
        this.contract.team = cloneDeep(invoice.team).map((member) => ({
          user: member.user,
          coordination: member.coordination,
          distribution: '',
          netValue: '0,00',
          grossValue: '0,00',
        }));
        this.contract.team.unshift({
          user: invoice.author,
          coordination: invoice.coordination,
          distribution: '',
          netValue: '0,00',
          grossValue: '0,00',
        });
      }
    } else {
      this.contract.team = this.contract.team.map((member, idx) => {
        member.netValue = this.stringUtil.numberToMoney(
          this.stringUtil.moneyToNumber(this.contract.liquid) *
            (1 - this.stringUtil.toMutiplyPercentage(member.distribution))
        );
        member.grossValue = this.contractService.toGrossValue(
          member.netValue,
          this.options.notaFiscal,
          this.options.nortanPercentage
        );
        return member;
      });
    }
    this.updateTeamTotal();
    this.userData = this.completerService
      .local(this.userService.getUsersList(), 'fullName', 'fullName')
      .imageField('profilePicture');
    this.loadTableExpenses();
  }

  updateContract(): void {
    let version = +this.contract.version;
    version += 1;
    this.contract.version = version.toString().padStart(2, '0');
    this.contract.lastUpdate = new Date();
    this.iContract = cloneDeep(this.contract);
    this.contractService.editContract(this.iContract);
  }

  paymentDialog(componentType: ComponentTypes, index?: number): void {
    this.isDialogBlocked.next(true);
    index = index != undefined ? index : undefined;
    let title = '';
    switch (componentType) {
      case ComponentTypes.RECEIPT:
        title =
          index != undefined
            ? 'ORDEM DE EMPENHO'
            : 'ADICIONAR ORDEM DE EMPENHO';
        break;
      case ComponentTypes.PAYMENT:
        title =
          index != undefined
            ? 'ORDEM DE PAGAMENTO'
            : 'ADICIONAR ORDEM DE PAGAMENTO';
        break;
      case ComponentTypes.EXPENSE:
        title = index != undefined ? 'DESPESA' : 'ADICIONAR DESPESA';
        break;
      default:
        break;
    }

    this.dialogService
      .open(ContractDialogComponent, {
        context: {
          title: title,
          contract: this.contract,
          contractIndex: this.index,
          paymentIndex:
            componentType == ComponentTypes.PAYMENT ? index : undefined,
          receiptIndex:
            componentType == ComponentTypes.RECEIPT ? index : undefined,
          expenseIndex:
            componentType == ComponentTypes.EXPENSE ? index : undefined,
          componentType: componentType,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.calculatePaidValue();
        this.calculateBalance();
        if (componentType === ComponentTypes.EXPENSE) this.loadTableExpenses();
        this.isDialogBlocked.next(false);
      });
  }

  confirmationDialog(index: number, componentType: ComponentTypes): void {
    this.isDialogBlocked.next(true);
    let item = '';
    switch (componentType) {
      case ComponentTypes.RECEIPT:
        item = 'a ordem de empenho #' + (index + 1).toString() + '?';
        break;
      case ComponentTypes.PAYMENT:
        item = 'a ordem de pagamento #' + (index + 1).toString() + '?';
        break;
      case ComponentTypes.EXPENSE:
        item = 'a despesa #' + (index + 1).toString() + '?';
        break;
      default:
        break;
    }

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
          switch (componentType) {
            case ComponentTypes.RECEIPT:
              this.contract.receipts.splice(index, 1);
              break;
            case ComponentTypes.PAYMENT:
              this.contract.payments.splice(index, 1);
              break;
            case ComponentTypes.EXPENSE:
              this.contract.expenses.splice(index, 1);
              this.loadTableExpenses();
              break;
            default:
              break;
          }
          this.calculatePaidValue();
          this.calculateBalance();
          this.updateContract();
        }
        this.isDialogBlocked.next(false);
      });
  }

  calculatePaidValue(): void {
    this.options.interest = this.contract.receipts.length;
    this.options.notaFiscal = this.utils.nfPercentage(this.contract);
    this.options.nortanPercentage = this.utils.nortanPercentage(this.contract);
    this.updateLiquid();
    this.options.paid = this.contractService.toNetValue(
      this.stringUtil.numberToMoney(
        this.contract.receipts.reduce((accumulator: number, recipt: any) => {
          if (recipt.paid)
            accumulator =
              accumulator + this.stringUtil.moneyToNumber(recipt.value);
          return accumulator;
        }, 0)
      ),
      this.options.notaFiscal,
      this.options.nortanPercentage
    );
    this.contract.notPaid = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.contract.liquid) -
        this.stringUtil.moneyToNumber(this.options.paid)
    );
  }

  calculateBalance(): void {
    const expenseContribution = this.contract.expenses.reduce(
      (accumulator, expense: any) => {
        if (expense.paid) {
          if (
            this.userService.idToUser(expense.source)._id ==
            CONTRACT_BALANCE._id
          )
            accumulator.expense += this.stringUtil.moneyToNumber(expense.value);

          if (expense.type == EXPENSE_TYPES.APORTE)
            accumulator.contribution += this.stringUtil.moneyToNumber(
              expense.value
            );
        }
        return accumulator;
      },
      { expense: 0, contribution: 0 }
    );
    this.contract.balance = this.stringUtil.numberToMoney(
      this.stringUtil.round(
        this.stringUtil.moneyToNumber(this.options.paid) -
          this.contract.payments.reduce((accumulator: number, payment: any) => {
            if (payment.paid)
              accumulator =
                accumulator + this.stringUtil.moneyToNumber(payment.value);
            return accumulator;
          }, 0) -
          expenseContribution.expense +
          expenseContribution.contribution
      )
    );
  }

  tooltipText(): string {
    if (this.contract.invoice) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      if (invoice.contractor)
        return (
          `CPF/CNPJ: ` +
          this.contractorService.idToContractor(invoice.contractor).document +
          `\nEmail: ` +
          this.contractorService.idToContractor(invoice.contractor).email +
          `\nEndereço: ` +
          this.contractorService.idToContractor(invoice.contractor).address
        );
    }
    return '';
  }

  addColaborator(): void {
    this.contract.team.push(Object.assign({}, this.teamMember));
    this.userSearch = '';
    this.teamMember = {};
    this.updateTeamTotal();
  }

  updateTeamTotal(): void {
    this.teamTotal = this.contract.team.reduce(
      (sum, member) => {
        sum.grossValue = this.stringUtil.sumMoney(
          sum.grossValue,
          member.grossValue
        );
        sum.netValue = this.stringUtil.sumMoney(sum.netValue, member.netValue);
        sum.distribution = this.stringUtil.sumMoney(
          sum.distribution,
          member.distribution
        );
        return sum;
      },
      {
        grossValue: '0,00',
        netValue: '0,00',
        distribution: '0,00',
      }
    );
  }

  formatDate(date: Date): string {
    return format(date, 'dd/MM/yyyy');
  }

  expenseTypesSum(): ExpenseTypesSum[] {
    const result = this.contract.expenses.reduce(
      (sum: ExpenseTypesSum[], expense) => {
        const idx = sum.findIndex((el) => el.type == expense.type);
        sum[idx].value = this.stringUtil.sumMoney(
          sum[idx].value,
          expense.value
        );
        return sum;
      },
      this.EXPENSE_OPTIONS.map((type) => ({
        type: type,
        value: '0,00',
      }))
    );
    const total = result.reduce(
      (sum, expense) => this.stringUtil.sumMoney(sum, expense.value),
      '0,00'
    );
    result.push({ type: 'TOTAL', value: total });
    return result;
  }

  expenseSourceSum(): ExpenseSourceSum[] {
    const result = this.contract.expenses.reduce(
      (sum: ExpenseSourceSum[], expense) => {
        if (expense.source != undefined) {
          const source = this.userService.idToShortName(expense.source);
          const idx = sum.findIndex((el) => el.user == source);
          if (idx != -1)
            sum[idx].value = this.stringUtil.sumMoney(
              sum[idx].value,
              expense.value
            );
        }
        return sum;
      },
      [CONTRACT_BALANCE.fullName]
        .concat(
          this.contract.team
            .map((member) => {
              if (member.user)
                return this.userService.idToShortName(member.user);
              return '';
            })
            .filter((n) => n.length > 0)
        )
        .map((name) => ({ user: name, value: '0,00' }))
    );
    const total = result.reduce(
      (sum, expense) => this.stringUtil.sumMoney(sum, expense.value),
      '0,00'
    );
    result.push({ user: 'TOTAL', value: total });
    return result;
  }

  updateLiquid(): void {
    this.contract.liquid = this.contractService.toNetValue(
      this.contractService.subtractComissions(
        this.stringUtil.applyPercentage(this.contract.value, this.contract.ISS),
        this.contract
      ),
      this.options.notaFiscal,
      this.options.nortanPercentage
    );
  }

  updateValue(idx?: number): void {
    if (idx != undefined) {
      this.contract.team[idx].netValue = this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(this.contract.liquid) *
          (1 -
            this.stringUtil.toMutiplyPercentage(
              this.contract.team[idx].distribution
            ))
      );
      this.contract.team[idx].grossValue = this.contractService.toGrossValue(
        this.contract.team[idx].netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
      this.updateTeamTotal();
    } else {
      this.teamMember.netValue = this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(this.contract.liquid) *
          (1 -
            this.stringUtil.toMutiplyPercentage(this.teamMember.distribution))
      );
      this.teamMember.grossValue = this.contractService.toGrossValue(
        this.teamMember.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
    }
  }

  updatePercentage(idx?: number): void {
    if (idx != undefined) {
      this.contract.team[idx].distribution = this.stringUtil
        .toPercentage(
          this.contract.team[idx].netValue,
          this.contract.liquid,
          20
        )
        .slice(0, -1);
      this.contract.team[idx].grossValue = this.contractService.toGrossValue(
        this.contract.team[idx].netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
      this.updateTeamTotal();
    } else {
      this.teamMember.distribution = this.stringUtil
        .toPercentage(this.teamMember.netValue, this.contract.liquid, 20)
        .slice(0, -1);
      this.teamMember.grossValue = this.contractService.toGrossValue(
        this.teamMember.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
    }
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

  loadTableExpenses(): void {
    this.source.load(
      this.contract.expenses.map((expense: any, index: number) => {
        const tmp = cloneDeep(expense);
        tmp.number = '#' + (index + 1).toString();
        tmp.source = this.userService.idToShortName(tmp.source);
        tmp.created = format(tmp.created, 'dd/MM/yyyy');
        return tmp;
      })
    );
  }

  profilePicture(uId: string | User | undefined): string {
    if (uId === undefined) return '';
    const author = this.userService.idToUser(uId);
    if (author.profilePicture === undefined) return '';
    return author.profilePicture;
  }
}
