import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DepartmentService } from '../../../../shared/services/department.service';
import * as contract_validation from '../../../../shared/payment-validation.json';
import { ContractService } from '../../../../shared/services/contract.service';
import { UserService } from '../../../../shared/services/user.service';
import { BrMaskDirective } from '../../../../shared/directives/br-mask';

@Component({
  selector: 'ngx-payment-item',
  templateUrl: './payment-item.component.html',
  styleUrls: ['./payment-item.component.scss'],
})
export class PaymentItemComponent implements OnInit {
  @Input() contract: any;
  @Output() submit = new EventEmitter<void>();
  COORDINATIONS: string[];
  USERS: any[];
  validation = (contract_validation as any).default;
  submitted = false;
  payment: any = {
    team: [], // TODO: Tratar carregamento de OE
    notaFiscal: '6', // Porcentagem da nota fiscal
    nortanPercentage: '15', // TODO: Pegar este valor do cargo do autor do contrato
  };
  userPayment: any = {};
  options = {
    valueType: '%',
    liquid: undefined,
  };

  constructor(
    private departmentService: DepartmentService,
    private contractService: ContractService,
    private userService: UserService,
    private brMask: BrMaskDirective
  ) {}

  async ngOnInit(): Promise<void> {
    this.COORDINATIONS = this.departmentService.buildAllCoordinationsList();
    this.USERS = await this.userService.getUsersList();
  }

  registerPayment(): void {
    this.payment.contract = this.contract._id;
    console.log(this.payment);
    this.submitted = true;
    this.contractService.addPayment(this.payment);
    this.submit.emit();
  }

  async addColaborator(): Promise<void> {
    this.payment.team.push(Object.assign({}, this.userPayment));
    this.userPayment = {};
  }

  idToName(id: string): string {
    const entry = this.USERS.find((el) => el._id === id);
    return entry.fullName;
  }

  moneyToNumber(money: string): number {
    const result = money.replace('.', '').replace(',', '.');
    return +result;
  }

  round(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  toMutiplyPercentage(percentage: string): number {
    const num = (100 - +percentage) / 100;
    return this.round(num);
  }

  toLiquid(value: string): void {
    const result = this.round(
      this.moneyToNumber(value) *
        this.toMutiplyPercentage(this.payment.notaFiscal) *
        this.toMutiplyPercentage(this.payment.nortanPercentage)
    )
      .toFixed(2)
      .toString();
    this.options.liquid = this.brMask.writeValueMoney(
      result.replace('.', ','),
      {
        money: true,
        thousand: '.',
        decimalCaracter: ',',
        decimal: 2,
      }
    );
  }

  isTeamEmpty(): boolean {
    return this.payment.team.length === 0;
  }
}
