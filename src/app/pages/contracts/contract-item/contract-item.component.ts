import { Component, OnInit, Input } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { CompleterService, CompleterData } from 'ng2-completer';
import { format, parseISO } from 'date-fns';
import { take } from 'rxjs/operators';
import { ContractService } from '../../../shared/services/contract.service';
import { StringUtilService } from '../../../shared/services/string-util.service';
import { UserService } from '../../../shared/services/user.service';
import { DepartmentService } from 'app/shared/services/department.service';
import {
  ContractDialogComponent,
  ComponentTypes,
} from '../contract-dialog/contract-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import * as contract_validation from '../../../shared/contract-validation.json';
import * as _ from 'lodash';

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
})
export class ContractItemComponent implements OnInit {
  @Input() iContract: any;
  @Input() index: number;
  contract: any;
  contractNumber: number;
  types = ComponentTypes;
  today = new Date();
  todayDate = format(this.today, 'dd/MM/yyyy');
  validation = (contract_validation as any).default;
  STATOOS = ['Em andamento', 'A receber', 'Concluído', 'Arquivado'];
  INTERESTS = [...Array(24).keys()].map((index) => (index + 1).toString());
  USER_COORDINATIONS = [];
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
  options = {
    valueType: '%',
  };

  teamMember: any = {};
  userSearch: string;
  userData: CompleterData;

  constructor(
    private contractService: ContractService,
    private dialogService: NbDialogService,
    private stringUtil: StringUtilService,
    private completerService: CompleterService,
    public userService: UserService,
    public departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.contract = _.cloneDeep(this.iContract);
    this.contract.interest = this.contract.receipts.length;
    this.calculatePaidValue();
    this.calculateBalance();
    if (
      this.contract.created !== undefined &&
      typeof this.contract.created !== 'object'
    )
      this.contract.created = parseISO(this.contract.created);
    if (
      this.contract.lastUpdate !== undefined &&
      typeof this.contract.lastUpdate !== 'object'
    ) {
      this.contract.lastUpdate = parseISO(this.contract.lastUpdate);
      this.contract.lastUpdate = format(this.contract.lastUpdate, 'dd/MM/yyyy');
    }
    if (!this.contract.team || this.contract.team?.length == 0) {
      this.contract.team = _.cloneDeep(this.contract.invoice.team);
      this.contract.team = this.contract.team.map((member) =>
        this.userService.idToUser(member.user)
      );
      this.contract.team.unshift({
        user: this.contract.invoice.author,
        coordination: this.contract.invoice.coordination,
      });
    } else {
      this.contract.team = this.contract.team.map((member) =>
        this.userService.idToUser(member.user)
      );
    }
    this.userData = this.completerService
      .local(this.userService.getUsersList(), 'fullName', 'fullName')
      .imageField('profilePicture');
  }

  updateContract(): void {
    let version = +this.contract.version;
    version += 1;
    this.contract.version = version.toString().padStart(2, '0');
    this.contract.lastUpdate = new Date();
    this.iContract = _.cloneDeep(this.contract);
    this.contractService.editContract(this.iContract);
    this.contract.lastUpdate = format(this.contract.lastUpdate, 'dd/MM/yyyy');
  }

  paymentDialog(index: number, componentType: ComponentTypes): void {
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
      });
  }

  confirmationDialog(index: number, componentType: ComponentTypes): void {
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
          question: 'Realmente deseja exlucir ' + item,
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
              this.calculatePaidValue();
              this.calculateBalance();
              break;
            case ComponentTypes.PAYMENT:
              this.contract.payments.splice(index, 1);
              this.calculateBalance();
              break;
            case ComponentTypes.EXPENSE:
              this.contract.expenses.splice(index, 1);
              this.calculateBalance();
              break;
            default:
              break;
          }
          this.updateContract();
        }
      });
  }

  calculatePaidValue(): void {
    this.contract.interest = this.contract.receipts.length;
    this.contract.paid = this.stringUtil.numberToMoney(
      this.contract.receipts.reduce((accumulator: number, recipt: any) => {
        if (recipt.paid)
          accumulator =
            accumulator + this.stringUtil.moneyToNumber(recipt.value);
        return accumulator;
      }, 0)
    );
  }

  calculateBalance(): void {
    this.contract.balance = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.contract.paid) -
        this.contract.payments.reduce((accumulator: number, payment: any) => {
          if (payment.paid)
            accumulator =
              accumulator + this.stringUtil.moneyToNumber(payment.value);
          return accumulator;
        }, 0) -
        this.contract.expenses.reduce((accumulator: number, expense: any) => {
          if (expense.paid)
            accumulator =
              accumulator + this.stringUtil.moneyToNumber(expense.value);
          return accumulator;
        }, 0)
    );
  }

  tooltipText(): string {
    return (
      `CPF/CNPJ: ` +
      this.contract.invoice.contractor.document +
      `\nEmail: ` +
      this.contract.invoice.contractor.email +
      `\nEndereço: ` +
      this.contract.invoice.contractor.address
    );
  }

  addColaborator(): void {
    if (this.options.valueType == '$')
      this.teamMember.distribution = this.stringUtil
        .toPercentage(this.teamMember.distribution, this.contract.total)
        .slice(0, -1);
    this.contract.team.push(Object.assign({}, this.teamMember));
    this.userSearch = undefined;
    this.teamMember = {};
  }

  formatDate(date): string {
    if (date !== undefined && typeof date !== 'object') date = parseISO(date);
    date = format(date, 'dd/MM/yyyy');
    return date;
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
