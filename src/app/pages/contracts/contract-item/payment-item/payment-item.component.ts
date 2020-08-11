import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DepartmentService } from '../../../../shared/services/department.service';
import * as contract_validation from '../../../../shared/payment-validation.json';
import { ContractService } from '../../../../shared/services/contract.service';
import { UserService } from '../../../../shared/services/user.service';
import { StringUtilService } from '../../../../shared/services/string-util.service';

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
  COORDINATIONS: string[];
  USERS: any[];
  total = '0';
  validation = (contract_validation as any).default;
  submitted = false;
  payment: any = {
    team: [],
    notaFiscal: '6', // Porcentagem da nota fiscal
    nortanPercentage: '15', // TODO: Pegar este valor do cargo do autor do contrato
  };
  userPayment: any = {};
  options = {
    valueType: '$',
    liquid: '0',
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
    if (this.paymentIndex !== undefined) {
      this.payment = this.contract.payments[this.paymentIndex];
      this.toLiquid(this.payment.value);
      this.updateTotal();
    }
  }

  registerPayment(): void {
    this.payment.contract = this.contract._id;
    this.submitted = true;
    this.contractService.addPayment(this.payment, this.contractIndex);
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
}
