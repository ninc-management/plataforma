import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { format, parseISO } from 'date-fns';
import { DepartmentService } from '../../../../shared/services/department.service';
import { ContractService } from '../../../../shared/services/contract.service';
import { UserService } from '../../../../shared/services/user.service';
import { StringUtilService } from '../../../../shared/services/string-util.service';
import * as contract_validation from '../../../../shared/payment-validation.json';

@Component({
  selector: 'ngx-payment-item',
  templateUrl: './payment-item.component.html',
  styleUrls: ['./payment-item.component.scss'],
})
export class PaymentItemComponent implements OnInit {
  @Input() contract: any;
  @Input() contractIndex: number;
  @Input() paymentIndex: number;
  @Output() submit = new EventEmitter<void>();
  @ViewChild('value', { static: false, read: ElementRef })
  valueInputRef: ElementRef<HTMLInputElement>;
  COORDINATIONS: string[];
  USERS: any[];
  total = '0';
  today = new Date();
  validation = (contract_validation as any).default;
  submitted = false;
  payment: any = {
    team: [],
    notaFiscal: '15.5', // Porcentagem da nota fiscal
    nortanPercentage: '15', // TODO: Pegar este valor do cargo do autor do contrato
    paid: 'não',
    created: this.today,
    lastUpdate: this.today,
  };
  userPayment: any = {};
  options = {
    valueType: '$',
    liquid: '0',
    lastUpdateDate: format(this.payment.lastUpdate, 'dd/MM/yyyy'),
  };

  constructor(
    private departmentService: DepartmentService,
    private contractService: ContractService,
    private userService: UserService,
    private stringUtil: StringUtilService
  ) {}

  async ngOnInit(): Promise<void> {
    this.COORDINATIONS = this.departmentService.buildAllCoordinationsList();
    this.USERS = await this.userService.getUsersList();
    this.contract.paid = this.stringUtil.numberToMoney(
      this.contract.payments.reduce(
        (accumulator: number, payment: any) =>
          accumulator + this.stringUtil.moneyToNumber(payment.value),
        0
      )
    );
    if (this.contract.payments.length === this.contract.total - 1) {
      this.payment.value = this.notPaid();
      this.toLiquid(this.payment.value);
    }
    if (this.paymentIndex !== undefined) {
      this.payment = Object.assign(
        {},
        this.contract.payments[this.paymentIndex]
      );
      this.toLiquid(this.payment.value);
      this.updateTotal();
      this.contract.paid = this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(this.contract.paid) -
          this.stringUtil.moneyToNumber(this.payment.value)
      );
      if (
        this.payment.paidDate !== undefined &&
        typeof this.payment.paidDate !== 'object'
      )
        this.payment.paidDate = parseISO(this.payment.paidDate);
      if (
        this.payment.created !== undefined &&
        typeof this.payment.created !== 'object'
      )
        this.payment.created = parseISO(this.payment.created);
      if (
        this.payment.lastUpdate !== undefined &&
        typeof this.payment.lastUpdate !== 'object'
      ) {
        this.payment.lastUpdate = parseISO(this.payment.lastUpdate);
        this.payment.lastUpdate = format(this.payment.lastUpdate, 'dd/MM/yyyy');
      }
    }
  }

  registerPayment(): void {
    this.payment.contract = this.contract._id;
    this.submitted = true;
    if (this.paymentIndex !== undefined) {
      this.payment.lastUpdate = new Date();
      this.contractService.editPayment(this.payment, this.contractIndex);
      this.contract.payments[this.paymentIndex] = Object.assign(
        {},
        this.payment
      );
    } else {
      this.contractService.addPayment(this.payment, this.contractIndex);
    }
    this.submit.emit();
  }

  addColaborator(): void {
    if (this.options.valueType === '%')
      this.userPayment.value = this.toValue(this.userPayment.value);
    this.payment.team.push(Object.assign({}, this.userPayment));
    this.userPayment = {};
    this.updateTotal();
  }

  idToName(id: string): string {
    const entry = this.USERS.find((el) => el._id === id);
    return entry.fullName;
  }

  toLiquid(value: string): void {
    const result = this.stringUtil.round(
      this.stringUtil.moneyToNumber(value) *
        this.stringUtil.toMutiplyPercentage(this.payment.notaFiscal) *
        this.stringUtil.toMutiplyPercentage(this.payment.nortanPercentage)
    );
    this.options.liquid = this.stringUtil.numberToMoney(result);
  }

  toPercentage(value: string): string {
    if (+this.options.liquid === 0) return '0,00%';
    return (
      this.stringUtil.numberToMoney(
        (this.stringUtil.moneyToNumber(value) /
          this.stringUtil.moneyToNumber(this.options.liquid)) *
          100
      ) + '%'
    );
  }

  toValue(percentage: string): string {
    return this.stringUtil.numberToMoney(
      (this.stringUtil.moneyToNumber(percentage.slice(0, -1)) / 100) *
        this.stringUtil.moneyToNumber(this.options.liquid)
    );
  }

  isTeamEmpty(): boolean {
    return this.payment.team.length === 0;
  }

  updateTotal(): void {
    this.total = this.stringUtil.numberToMoney(
      this.payment.team.reduce(
        (accumulator: number, userPayment: any) =>
          accumulator + this.stringUtil.moneyToNumber(userPayment.value),
        0
      )
    );
  }

  notPaid(): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.contract.value) -
        this.stringUtil.moneyToNumber(
          this.contract.paid ? this.contract.paid : '0,00'
        )
    );
  }

  remainingBalance(): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.options.liquid) -
        this.stringUtil.moneyToNumber(this.total)
    );
  }

  lastPayment(): string {
    if (
      (this.paymentIndex === undefined &&
        this.contract.payments.length != this.contract.total - 1) ||
      (this.paymentIndex !== undefined &&
        this.contract.payments.length - 1 != this.contract.total - 1)
    )
      return undefined;
    return this.notPaid();
  }

  updatePaidDate(): void {
    if (this.payment.paid === 'não') this.payment.paidDate = undefined;
    else this.payment.paidDate = new Date();
  }
}
