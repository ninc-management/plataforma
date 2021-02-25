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
import { CompleterService, CompleterData } from 'ng2-completer';
import { DepartmentService } from '../../../../shared/services/department.service';
import { ContractService } from '../../../../shared/services/contract.service';
import { UserService } from '../../../../shared/services/user.service';
import { StringUtilService } from '../../../../shared/services/string-util.service';
import * as contract_validation from '../../../../shared/payment-validation.json';
import * as _ from 'lodash';

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
  ALL_COORDINATIONS: string[];
  USER_COORDINATIONS: string[];
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
    lastLiquid: '0',
    lastTeam: [],
  };

  userSearch: string;
  userData: CompleterData;

  constructor(
    private departmentService: DepartmentService,
    private contractService: ContractService,
    private completerService: CompleterService,
    public userService: UserService,
    public stringUtil: StringUtilService
  ) {}

  ngOnInit(): void {
    this.ALL_COORDINATIONS = this.departmentService.buildAllCoordinationsList();
    this.userData = this.completerService
      .local(this.invoiceMemberList(), 'fullName', 'fullName')
      .imageField('profilePicture');
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
      this.payment = _.cloneDeep(this.contract.payments[this.paymentIndex]);
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
    } else {
      this.payment.team = this.contract.invoice.team.slice().map((member) => {
        member.user = member.user?._id ? member.user._id : member.user;
        return member;
      });
      for (const member of this.contract.team) {
        let entry = this.payment.team.find((el) => {
          const id1 = el.user?._id ? el.user._id : el.user;
          const id2 = member.user?._id ? member.user._id : member.user;
          return id1 === id2;
        });
        if (entry) {
          entry.value = member.distribution;
          if (this.options.liquid !== '0')
            entry.value = this.stringUtil.numberToMoney(
              this.stringUtil.moneyToNumber(this.options.liquid) *
                (1 - this.stringUtil.toMutiplyPercentage(entry.value))
            );
        } else {
          /* eslint-disable @typescript-eslint/indent */
          const value =
            this.options.liquid !== '0'
              ? this.stringUtil.numberToMoney(
                  this.stringUtil.moneyToNumber(this.options.liquid) *
                    (1 -
                      this.stringUtil.toMutiplyPercentage(member.distribution))
                )
              : member.distribution;
          const m: any = { user: member.user, value: value };
          const authorId = this.contract.invoice.author?._id
            ? this.contract.invoice.author._id
            : this.contract.invoice.author;
          if (member.user === authorId)
            m.coordination = this.contract.invoice.coordination;
          this.payment.team.push(m);
          /* eslint-enable @typescript-eslint/indent */
        }
      }
      this.updateTotal();
    }
  }

  invoiceMemberList(): any[] {
    let members = [];
    members.push(this.contract.invoice.author);
    this.contract.invoice.team.map((member) => {
      const user =
        member.user?._id == undefined
          ? this.userService.idToUser(member.user)
          : member.user;
      members.push(user);
    });
    return members;
  }

  registerPayment(): void {
    this.submitted = true;
    if (this.paymentIndex !== undefined) {
      this.payment.lastUpdate = new Date();
      this.contract.payments[this.paymentIndex] = _.cloneDeep(this.payment);
    } else {
      this.contract.payments.push(_.cloneDeep(this.payment));
    }
    this.contract.status =
      this.payment.paid == 'sim'
        ? this.contract.total == this.contract.payments.length
          ? 'Concluído'
          : 'Em andamento'
        : 'A receber';
    this.contractService.editContract(this.contract);
    this.submit.emit();
  }

  addColaborator(): void {
    if (this.options.valueType === '%')
      this.userPayment.value = this.stringUtil.toValue(
        this.userPayment.value,
        this.options.liquid
      );
    this.payment.team.push(Object.assign({}, this.userPayment));
    this.userPayment = {};
    this.userSearch = undefined;
    this.updateTotal();
  }

  toLiquid(value: string): void {
    const result = this.stringUtil.round(
      this.stringUtil.moneyToNumber(value) *
        this.stringUtil.toMutiplyPercentage(this.payment.notaFiscal) *
        this.stringUtil.toMutiplyPercentage(this.payment.nortanPercentage)
    );
    this.options.liquid = this.stringUtil.numberToMoney(result);
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

  updateUserCoordinations(): void {
    const selectedUser = this.userPayment.user;
    const active: boolean[] = [
      selectedUser.adm,
      selectedUser.design,
      selectedUser.obras,
      selectedUser.impermeabilizacao,
      selectedUser.instalacoes,
      selectedUser.ambiental,
      selectedUser.arquitetura,
      selectedUser.hidrico,
      selectedUser.eletrica,
      selectedUser.civil,
      selectedUser.sanitaria,
    ];
    this.USER_COORDINATIONS = this.ALL_COORDINATIONS.filter(
      (cd: string, idx: number) => {
        return active[idx];
      }
    );
    this.userPayment.coordination = undefined;
  }

  calculateTeamValues(): void {
    if (this.options.liquid !== '0') {
      this.payment.team.map((member, index) => {
        if (
          this.stringUtil.moneyToNumber(this.options.lastTeam[index].value) <=
          100
        )
          member.value = this.stringUtil.numberToMoney(
            this.stringUtil.moneyToNumber(this.options.liquid) *
              (1 -
                this.stringUtil.toMutiplyPercentage(
                  this.options.lastTeam[index].value
                ))
          );
        else {
          const p = this.stringUtil
            .toPercentage(
              this.options.lastTeam[index].value,
              this.options.lastLiquid
            )
            .slice(0, -1);
          member.value = this.stringUtil.numberToMoney(
            this.stringUtil.moneyToNumber(this.options.liquid) *
              (1 - this.stringUtil.toMutiplyPercentage(p))
          );
        }
        return member;
      });
    }
    this.updateTotal();
  }

  updateLastValues(): void {
    this.options.lastLiquid = this.options.liquid.slice();
    this.options.lastTeam = _.cloneDeep(this.payment.team);
  }
}
