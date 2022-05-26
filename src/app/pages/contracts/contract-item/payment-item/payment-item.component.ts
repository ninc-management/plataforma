import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { cloneDeep } from 'lodash';
import { NbAccessChecker } from '@nebular/security';
import { NbDialogService } from '@nebular/theme';
import { ContractService } from 'app/shared/services/contract.service';
import { UserService } from 'app/shared/services/user.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { ContractUserPayment, ContractPayment, Contract } from '@models/contract';
import { User } from '@models/user';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import contract_validation from 'app/shared/payment-validation.json';
import { TeamService } from 'app/shared/services/team.service';
import { Sector } from '@models/shared';
import { trackByIndex, formatDate, idToProperty, shouldNotifyManager } from 'app/shared/utils';
import { NotificationService, NotificationTags } from 'app/shared/services/notification.service';

@Component({
  selector: 'ngx-payment-item',
  templateUrl: './payment-item.component.html',
  styleUrls: ['./payment-item.component.scss'],
})
export class PaymentItemComponent implements OnInit {
  private hasBeenDeleted = false;
  @Input() contract = new Contract();
  @Input() availableContracts: Contract[] = [];
  @Input() paymentIndex?: number;
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() submit = new EventEmitter<void>();
  invoice = new Invoice();
  hasInitialContract = true;
  validation = contract_validation as any;
  ALL_SECTORS: Sector[] = [];
  USER_SECTORS: Sector[] = [];
  teamUsers: User[] = [];
  total = '0';
  today = new Date();
  submitted = false;
  isEditionGranted = false;
  isFinancialManager = false;
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
    sector: '',
  };
  options = {
    valueType: '$',
    lastValue: '0',
    lastTeam: [] as ContractUserPayment[],
    initialTeam: [] as ContractUserPayment[],
  };

  memberChanged$ = new BehaviorSubject<boolean>(true);
  userSearch = '';
  availableUsers: Observable<User[]> = of([]);

  contractSearch = '';
  get availableContractsData(): Observable<Contract[]> {
    return of(this.availableContracts);
  }

  get is100(): boolean {
    return (
      this.payment.team.reduce((sum, m) => {
        sum = this.stringUtil.sumMoney(sum, m.value);
        return sum;
      }, '0,00') === this.payment.value
    );
  }

  trackByIndex = trackByIndex;
  formatDate = formatDate;
  idToProperty = idToProperty;

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private notificationService: NotificationService,
    public contractService: ContractService,
    public stringUtil: StringUtilService,
    public userService: UserService,
    public accessChecker: NbAccessChecker,
    public teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.ALL_SECTORS = this.teamService.sectorsListAll();
    this.availableUsers = this.memberChanged$.pipe(
      map((_) => {
        return this.teamUsers.filter((user) => {
          return this.payment.team.find((member: ContractUserPayment) =>
            this.userService.isEqual(user, member.user)
          ) === undefined
            ? true
            : false;
        });
      })
    );
    if (this.contract._id) this.fillContractData();
    else this.hasInitialContract = false;
  }

  confirmationDialog(index: number): void {
    if (this.hasBeenDeleted) {
      this.payment.team.splice(index, 1);
      this.updateTotal();
      this.memberChanged$.next(true);
    } else {
      this.isDialogBlocked.next(true);

      this.dialogService
        .open(ConfirmationDialogComponent, {
          context: {
            question: 'Você tem certeza que deseja alterar a distribuição do pagamento neste contrato?',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        })
        .onClose.pipe(take(1))
        .subscribe((response) => {
          if (response) {
            this.payment.team.splice(index, 1);
            this.updateTotal();
            this.memberChanged$.next(true);
            this.hasBeenDeleted = true;
          }

          this.isDialogBlocked.next(false);
        });
    }
  }

  fillContractData(): void {
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.teamUsers = this.invoice.team
        .map((member: InvoiceTeamMember) => {
          if (member.user) return this.userService.idToUser(member.user);
          return;
        })
        .filter((user): user is User => !!user);
      if (this.paymentIndex !== undefined) {
        this.payment = cloneDeep(this.contract.payments[this.paymentIndex]);
        this.updateLastValues();
        this.options.initialTeam = cloneDeep(this.payment.team);
        this.calculateTeamValues();
      } else {
        this.payment.team = cloneDeep(this.invoice.team).map((member: InvoiceTeamMember): ContractUserPayment => {
          const payment: ContractUserPayment = {
            sector: member.sector,
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
        });
      }
      this.memberChanged$.next(true);
      this.contractService
        .checkEditPermission(this.invoice)
        .pipe(take(1))
        .subscribe((isGranted) => {
          this.isEditionGranted = isGranted;
        });
      this.accessChecker
        .isGranted('df', 'payment-financial-manager')
        .pipe(take(1))
        .subscribe((isGranted) => (this.isFinancialManager = isGranted));
    }
  }

  registerPayment(): void {
    this.submitted = true;
    if (this.paymentIndex !== undefined) {
      this.payment.lastUpdate = new Date();
      if (shouldNotifyManager(this.contract.payments[this.paymentIndex], this.payment)) this.notifyManager();
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
      this.userPayment.value = this.stringUtil.toValue(this.userPayment.value, this.payment.value);
    } else
      this.userPayment.percentage = this.stringUtil
        .toPercentage(this.userPayment.value, this.payment.value, 20)
        .slice(0, -1);

    this.payment.team.push(Object.assign({}, this.userPayment));
    this.userPayment = {
      user: undefined,
      value: '',
      percentage: '',
      sector: '',
    };
    this.userSearch = '';
    this.updateTotal();
    this.memberChanged$.next(true);
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
        (accumulator: number, userPayment: any) => accumulator + this.stringUtil.moneyToNumber(userPayment.value),
        0
      )
    );
  }

  remainingBalance(): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.payment.value) - this.stringUtil.moneyToNumber(this.total)
    );
  }

  updatePaidDate(): void {
    if (!this.payment.paid) this.payment.paidDate = undefined;
    else this.payment.paidDate = new Date();
  }

  userNotPaidValue(paymentMember: ContractUserPayment): string {
    if (!this.contract.invoice) return '0,00';
    const invoiceMember = this.invoiceService
      .idToInvoice(this.contract.invoice)
      .team.find((member) => this.userService.isEqual(member.user, paymentMember.user));
    if (invoiceMember) {
      let result = this.stringUtil.sumMoney(
        this.contractService.notPaidValue(invoiceMember.distribution, invoiceMember.user, this.contract),
        this.stringUtil.numberToMoney(
          this.contractService.expensesContributions(this.contract, invoiceMember.user).user.cashback
        )
      );
      if (this.paymentIndex !== undefined) {
        const initialUser = this.options.initialTeam.find((member) =>
          this.userService.isEqual(member.user, paymentMember.user)
        );
        if (initialUser) result = this.stringUtil.sumMoney(result, initialUser.value);
      }
      return result;
    } else return '0,00';
  }

  updateUserSectors(): void {
    if (this.userPayment.user) {
      const selectedUser = this.userService.idToUser(this.userPayment.user);
      this.USER_SECTORS = this.teamService.userToSectors(selectedUser);
      this.userPayment.sector = '';
    }
  }

  calculateTeamValues(): void {
    if (this.payment.value !== '0') {
      this.payment.team.map((member, index) => {
        if (this.stringUtil.moneyToNumber(this.options.lastTeam[index].value) <= 1)
          member.value = this.stringUtil.numberToMoney(
            this.stringUtil.moneyToNumber(this.payment.value) *
              this.stringUtil.moneyToNumber(this.options.lastTeam[index].value)
          );
        else {
          const p = this.stringUtil
            .toPercentage(this.options.lastTeam[index].value, this.options.lastValue, 20)
            .slice(0, -1);
          member.value = this.stringUtil.applyPercentage(this.payment.value, p);
        }
        member.percentage = this.stringUtil.toPercentage(member.value, this.payment.value, 20).slice(0, -1);
        return member;
      });
    }
    this.updateTotal();
  }

  updateLastValues(): void {
    this.options.lastValue = this.payment.value ? this.payment.value.slice() : '0';
    this.options.lastTeam = cloneDeep(this.payment.team);
  }

  notifyManager(): void {
    if (this.contract.invoice) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.notificationService.notify(invoice.author, {
        title: 'Uma ordem de pagamento do contrato ' + this.contract.code + ' foi paga!',
        tag: NotificationTags.PAYMENT_ORDER_PAID,
        message:
          'A ordem de pagamento de código #' +
          this.paymentIndex +
          ' com o valor de R$ ' +
          this.payment.value +
          ' foi paga.',
      });
    }
  }
}
