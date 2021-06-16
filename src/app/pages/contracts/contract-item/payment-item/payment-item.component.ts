import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';
import { DepartmentService } from 'app/shared/services/department.service';
import { ContractService } from 'app/shared/services/contract.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { BrMaskDirective } from 'app/shared/directives/br-mask.directive';
import { cloneDeep } from 'lodash';
import {
  ContractTeamMember,
  ContractUserPayment,
  ContractPayment,
  Contract,
} from '../../../../../../backend/src/models/contract';
import { User } from '../../../../../../backend/src/models/user';
import * as contract_validation from '../../../../shared/payment-validation.json';

@Component({
  selector: 'ngx-payment-item',
  templateUrl: './payment-item.component.html',
  styleUrls: ['./payment-item.component.scss'],
})
export class PaymentItemComponent implements OnInit {
  @Input() contract = new Contract();
  @Input() contractIndex?: number;
  @Input() paymentIndex?: number;
  @Output() submit = new EventEmitter<void>();
  @ViewChild('value', { static: false, read: ElementRef })
  valueInputRef!: ElementRef<HTMLInputElement>;
  validation = (contract_validation as any).default;
  ALL_COORDINATIONS: string[] = [];
  USER_COORDINATIONS: string[] = [];
  total = '0';
  today = new Date();
  submitted = false;
  payment: ContractPayment = {
    team: [],
    paid: false,
    created: this.today,
    lastUpdate: this.today,
    service: '',
    value: '0,00',
  };
  userPayment: ContractUserPayment = {
    user: undefined,
    value: '',
    percentage: '',
    coordination: '',
  };
  options = {
    valueType: '$',
    lastValue: '0',
    lastTeam: [] as ContractUserPayment[],
  };

  userSearch = '';
  userData: CompleterData = this.completerService.local([]);

  get is100(): boolean {
    return (
      this.payment.team.reduce((sum, m) => {
        sum = this.stringUtil.sumMoney(sum, m.value);
        return sum;
      }, '0,00') === this.payment.value
    );
  }

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
    const teamUsers = this.contract.team
      .map((member) => {
        if (member.user) return this.userService.idToUser(member.user);
        return;
      })
      .filter((user): user is User => user !== undefined);
    this.userData = this.completerService
      .local(teamUsers, 'fullName', 'fullName')
      .imageField('profilePicture');
    if (this.paymentIndex !== undefined) {
      this.payment = cloneDeep(this.contract.payments[this.paymentIndex]);
      this.payment.value = this.brMask.writeValueMoney(this.payment.value, {
        money: true,
        thousand: '.',
        decimalCaracter: ',',
        decimal: 2,
      });
      this.updateLastValues();
      this.calculateTeamValues();
    } else {
      this.payment.team = cloneDeep(this.contract.team).map(
        (member: ContractTeamMember): ContractUserPayment => {
          const payment: ContractUserPayment = {
            coordination: member.coordination,
            user: member.user,
            value: '0',
            percentage: '0',
          };
          if (member.distribution && member.user)
            payment.value = this.stringUtil.numberToString(
              this.stringUtil.toMultiplyPercentage(
                this.contractService.percentageToReceive(
                  member.distribution,
                  this.userService.idToUser(member.user),
                  this.contract,
                  20
                )
              ),
              20
            );
          return payment;
        }
      );
    }
  }

  registerPayment(): void {
    this.submitted = true;
    if (this.paymentIndex !== undefined) {
      this.payment.lastUpdate = new Date();
      this.contract.payments[this.paymentIndex] = cloneDeep(this.payment);
    } else {
      this.contract.payments.push(cloneDeep(this.payment));
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

    this.payment.team.push(Object.assign({}, this.userPayment));
    this.userPayment = {
      user: undefined,
      value: '',
      percentage: '',
      coordination: '',
    };
    this.userSearch = '';
    this.updateTotal();
  }

  updateValue(idx: number): void {
    this.payment.team[idx].value = this.stringUtil.applyPercentage(
      this.payment.value,
      this.payment.team[idx].percentage
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

  remainingBalance(): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.payment.value) -
        this.stringUtil.moneyToNumber(this.total)
    );
  }

  updatePaidDate(): void {
    if (!this.payment.paid) this.payment.paidDate = undefined;
    else this.payment.paidDate = new Date();
  }

  updateUserCoordinations(): void {
    if (this.userPayment.user) {
      const selectedUser = this.userService.idToUser(this.userPayment.user);
      this.USER_COORDINATIONS = this.departmentService.userCoordinations(
        selectedUser._id
      );
      this.userPayment.coordination = '';
    }
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
          member.value = this.stringUtil.applyPercentage(this.payment.value, p);
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
    this.options.lastTeam = cloneDeep(this.payment.team);
  }
}
