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
import { UtilsService } from '../../../../shared/services/utils.service';
import { StringUtilService } from '../../../../shared/services/string-util.service';
import { BrMaskDirective } from '../../../../shared/directives/br-mask.directive';
import {
  ContractTeamMember,
  ContractUserPayment,
} from '../../../../../../backend/src/models/contract';
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
  validation = (contract_validation as any).default;
  ALL_COORDINATIONS: string[];
  USER_COORDINATIONS: string[];
  total = '0';
  today = new Date();
  submitted = false;
  payment: any = {
    team: [],
    paid: false,
    created: this.today,
    lastUpdate: this.today,
  };
  userPayment: any = {};
  options = {
    valueType: '$',
    lastUpdateDate: format(this.payment.lastUpdate, 'dd/MM/yyyy'),
    lastValue: '0',
    lastTeam: [],
  };

  userSearch: string;
  userData: CompleterData;

  constructor(
    public departmentService: DepartmentService,
    private contractService: ContractService,
    private completerService: CompleterService,
    private brMask: BrMaskDirective,
    public userService: UserService,
    public stringUtil: StringUtilService,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.ALL_COORDINATIONS = this.departmentService.buildAllCoordinationsList();
    const team = this.contract.team.map((member) =>
      this.userService.idToUser(member.user)
    );
    this.userData = this.completerService
      .local(team, 'fullName', 'fullName')
      .imageField('profilePicture');
    if (this.paymentIndex !== undefined) {
      this.payment = _.cloneDeep(this.contract.payments[this.paymentIndex]);
      this.payment.value = this.brMask.writeValueMoney(this.payment.value, {
        money: true,
        thousand: '.',
        decimalCaracter: ',',
        decimal: 2,
      });
      this.updateLastValues();
      this.calculateTeamValues();
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
      this.payment.team = _.cloneDeep(this.contract.team).map(
        (member: ContractTeamMember) => {
          let payment: ContractUserPayment;
          payment.coordination = member.coordination;
          payment.user = this.userService.idToUser(member.user)._id;
          if (member.distribution)
            payment.value = this.stringUtil.numberToString(
              1 -
                this.stringUtil.toMutiplyPercentage(
                  this.contractService.percentageToReceive(
                    member.distribution,
                    this.userService.idToUser(member.user),
                    this.contract,
                    20
                  )
                ),
              20
            );
          else payment.value = '0';
          return member;
        }
      );
      // if (this.contract.payments.length === this.contract.total - 1) {
      //   this.payment.value = this.notPaid();
      //   this.updateLastValues();
      //   this.calculateTeamValues();
      // }
    }
  }

  registerPayment(): void {
    this.submitted = true;
    if (this.paymentIndex !== undefined) {
      this.payment.lastUpdate = new Date();
      this.contract.payments[this.paymentIndex] = _.cloneDeep(this.payment);
    } else {
      this.contract.payments.push(_.cloneDeep(this.payment));
    }
    this.contractService.editContract(this.contract);
    this.submit.emit();
  }

  addColaborator(): void {
    if (this.options.valueType === '%') {
      this.userPayment.percentage = this.userPayment.value;
      this.userPayment.value = this.stringUtil.toValue(
        this.userPayment.value,
        this.payment.value
      );
    } else
      this.userPayment.percentage = this.stringUtil
        .toPercentage(this.userPayment.value, this.payment.value, 20)
        .slice(0, -1);

    this.userPayment.user = this.userPayment.user._id;
    this.payment.team.push(Object.assign({}, this.userPayment));
    this.userPayment = {};
    this.userSearch = undefined;
    this.updateTotal();
  }

  updateValue(idx: number): void {
    this.payment.team[idx].value = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.payment.value) *
        (1 -
          this.stringUtil.toMutiplyPercentage(
            this.payment.team[idx].percentage
          ))
    );
  }

  updatePercentage(idx: number): void {
    this.payment.team[idx].percentage = this.stringUtil
      .toPercentage(this.payment.team[idx].value, this.payment.value, 20)
      .slice(0, -1);
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
    // return this.stringUtil.numberToMoney(
    //   this.stringUtil.moneyToNumber(this.contract.value) -
    //     this.stringUtil.moneyToNumber(
    //       this.contract.paid ? this.contract.paid : '0,00'
    //     )
    // );
    return '';
  }

  remainingBalance(): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.payment.value) -
        this.stringUtil.moneyToNumber(this.total)
    );
  }

  lastPayment(): string {
    // if (
    //   (this.paymentIndex === undefined &&
    //     this.contract.payments.length != this.contract.total - 1) ||
    //   (this.paymentIndex !== undefined &&
    //     this.contract.payments.length - 1 != this.contract.total - 1)
    // )
    //   return undefined;
    // return this.notPaid();
    return '';
  }

  updatePaidDate(): void {
    if (!this.payment.paid) this.payment.paidDate = undefined;
    else this.payment.paidDate = new Date();
  }

  updateUserCoordinations(): void {
    const selectedUser = this.userPayment.user;
    this.USER_COORDINATIONS = this.departmentService.userCoordinations(
      selectedUser._id
    );
    this.userPayment.coordination = undefined;
  }

  calculateTeamValues(): void {
    if (this.payment.value !== '0') {
      this.payment.team.map((member, index) => {
        if (
          this.stringUtil.moneyToNumber(this.options.lastTeam[index].value) <= 1
        )
          member.value = this.stringUtil.numberToMoney(
            this.stringUtil.moneyToNumber(this.payment.value) *
              this.stringUtil.moneyToNumber(this.options.lastTeam[index].value)
          );
        else {
          const p = this.stringUtil
            .toPercentage(
              this.options.lastTeam[index].value,
              this.options.lastValue,
              20
            )
            .slice(0, -1);
          member.value = this.stringUtil.numberToMoney(
            this.stringUtil.moneyToNumber(this.payment.value) *
              (1 - this.stringUtil.toMutiplyPercentage(p))
          );
        }
        member.percentage = this.stringUtil
          .toPercentage(member.value, this.payment.value, 20)
          .slice(0, -1);
        return member;
      });
    }
    this.updateTotal();
  }

  updateLastValues(): void {
    this.options.lastValue = this.payment.value
      ? this.payment.value.slice()
      : '0';
    this.options.lastTeam = _.cloneDeep(this.payment.team);
  }
}
