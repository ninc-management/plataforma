import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { cloneDeep, isEqual } from 'lodash';
import { BehaviorSubject, combineLatest, map, Observable, of, skipWhile, Subject, take, takeUntil } from 'rxjs';

import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import {
  applyPercentage,
  moneyToNumber,
  numberToMoney,
  removePercentage,
  subtractMoney,
  sumMoney,
  toPercentage,
} from 'app/shared/string-utils';
import {
  formatDate,
  idToProperty,
  isPhone,
  nfPercentage,
  nortanPercentage,
  omitDeep,
  trackByIndex,
} from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Invoice, InvoiceTeamMember, InvoiceTeamMemberLocals } from '@models/invoice';
import { Sector } from '@models/shared/sector';
import { User } from '@models/user';

import * as contract_validation from 'app/shared/validators/contract-validation.json';

@Component({
  selector: 'ngx-data-tab',
  templateUrl: './data-tab.component.html',
  styleUrls: ['./data-tab.component.scss'],
})
export class DataTabComponent implements OnInit {
  private destroy$ = new Subject<void>();
  @Input() contract: Contract = new Contract();
  @Input() clonedContract: Contract = new Contract();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @ViewChild('form') ngForm: NgForm = {} as NgForm;

  isEditionGranted = false;
  validation = (contract_validation as any).default;
  STATOOS = Object.values(CONTRACT_STATOOS);
  INTERESTS = [...Array(24).keys()].map((index) => (index + 1).toString());
  invoice: Invoice = new Invoice();
  comissionSum = '';
  today = new Date();
  userSearch = '';
  teamMember: InvoiceTeamMember = new InvoiceTeamMember();
  USER_SECTORS: Sector[] = [];
  options = {
    liquid: '0,00',
    paid: '0,00',
    hasISS: false,
    interest: 0,
    notaFiscal: '0',
    nortanPercentage: '0',
  };
  teamTotal = {
    grossValue: '0,00',
    netValue: '0,00',
    distribution: '0,00',
  };
  memberChanged$ = new BehaviorSubject<boolean>(true);
  isInputDisabled$ = new BehaviorSubject<boolean>(true);
  availableUsers: Observable<User[]> = of([]);
  authorSearch = '';
  authorData: Observable<User[]> = of([]);

  subtractMoney = subtractMoney;
  isPhone = isPhone;
  idToProperty = idToProperty;
  formatDate = formatDate;
  trackByIndex = trackByIndex;

  source: LocalDataSource = new LocalDataSource();

  constructor(
    private configService: ConfigService,
    public contractorService: ContractorService,
    public invoiceService: InvoiceService,
    public contractService: ContractService,
    public teamService: TeamService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.updateLiquid();
    this.updateTeamTotal();
    this.applyDistribution();
  }

  ngAfterViewInit() {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeData(): void {
    combineLatest([this.configService.getConfig(), this.configService.isDataLoaded$])
      .pipe(
        skipWhile(([_, isConfigDataLoaded]) => !isConfigDataLoaded),
        take(1)
      )
      .subscribe(([configs, _]) => {
        this.options.nortanPercentage = nortanPercentage(this.contract, configs[0].invoiceConfig);
        this.options.notaFiscal = nfPercentage(this.contract, configs[0].invoiceConfig);
      });
    if (this.clonedContract.invoice) this.invoice = this.invoiceService.idToInvoice(this.clonedContract.invoice);
    this.comissionSum = numberToMoney(this.contractService.getComissionsSum(this.clonedContract));
    this.availableUsers = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) => {
        return users.filter((user) => !this.userService.isUserInTeam(user, this.invoice.team) && user.active);
      })
    );
    this.options.interest = this.contract.receipts.length;
    this.options.paid = this.contractService.paidValue(this.contract);
    this.contractService
      .checkEditPermission(this.invoice)
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isEditionGranted = isGranted;
        if (isGranted) {
          this.isInputDisabled$.next(false);
          this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
            if (user.AER) {
              const u = cloneDeep(user);
              u.AER.unshift(u._id);
              if (this.invoice._id && this.invoice.author) {
                this.authorData = this.userService.getUsers().pipe(map((users) => users.filter((user) => user.active)));
              } else {
                this.authorData = of(
                  u.AER.filter((u): u is User | string => u != undefined).map((u) => this.userService.idToUser(u))
                );
                this.invoice.author = undefined;
              }
            } else {
              if (this.invoice._id) {
                this.authorData = this.userService.getUsers().pipe(map((users) => users.filter((user) => user.active)));
              } else {
                this.invoice.author = user;
              }
              this.authorSearch = idToProperty(
                this.invoice.author,
                this.userService.idToUser.bind(this.userService),
                'fullName'
              );
            }
          });
        }
      });
    if (this.invoice._id && this.invoice.author) {
      this.authorSearch = idToProperty(
        this.invoice.author,
        this.userService.idToUser.bind(this.userService),
        'fullName'
      );
    } else {
      this.authorSearch = '';
    }
    this.contractService.edited$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => {
        this.clonedContract.status = this.contract.status;
      }, 100);
    });
    if (this.clonedContract.ISS) {
      if (moneyToNumber(this.clonedContract.ISS) == 0) this.options.hasISS = false;
      else this.options.hasISS = true;
    } else {
      this.clonedContract.ISS = '0,00';
      this.options.hasISS = false;
    }
    this.invoice.team.forEach(
      (teamMember) => (teamMember.locals = !teamMember.locals ? ({} as InvoiceTeamMemberLocals) : teamMember.locals)
    );
  }

  tooltipText(): string {
    if (this.invoice._id && this.invoice.contractor) {
      const { document, phone, email, address } = this.contractorService.idToContractor(this.invoice.contractor);
      return `CPF/CNPJ: ` + document + `\nTelefone: ` + phone + `\nEmail: ` + email + `\nEndereço: ` + address;
    }
    return '';
  }

  updateTeamTotal(): void {
    this.teamTotal = this.invoice.team.reduce(
      (sum, member) => {
        sum.grossValue = sumMoney(sum.grossValue, member.locals.grossValue);
        sum.netValue = sumMoney(sum.netValue, member.locals.netValue);
        sum.distribution = sumMoney(sum.distribution, member.distribution);
        return sum;
      },
      {
        grossValue: '0,00',
        netValue: '0,00',
        distribution: '0,00',
      }
    );
  }

  updatePercentage(idx?: number): void {
    if (idx != undefined) {
      this.invoice.team[idx].distribution = toPercentage(
        this.invoice.team[idx].locals.netValue,
        this.clonedContract.locals.liquid,
        20
      ).slice(0, -1);
      this.updateTeamTotal();
    } else {
      this.teamMember.distribution = toPercentage(
        this.teamMember.locals.netValue,
        this.clonedContract.locals.liquid,
        20
      ).slice(0, -1);
    }
  }

  updateNetValue(idx?: number, source: 'gross' | 'distribution' = 'distribution'): void {
    if (idx != undefined) {
      if (source === 'gross') {
        this.invoice.team[idx].locals.netValue = this.contractService.toNetValue(
          this.invoice.team[idx].locals.grossValue,
          this.options.notaFiscal,
          this.options.nortanPercentage,
          this.clonedContract.created
        );
      } else {
        this.invoice.team[idx].locals.netValue = applyPercentage(
          this.clonedContract.locals.liquid,
          this.invoice.team[idx].distribution
        );
      }
      this.updateTeamTotal();
    } else {
      if (source === 'gross') {
        this.teamMember.locals.netValue = this.contractService.toNetValue(
          this.teamMember.locals.grossValue,
          this.options.notaFiscal,
          this.options.nortanPercentage,
          this.clonedContract.created
        );
      } else {
        this.teamMember.locals.netValue = applyPercentage(
          this.clonedContract.locals.liquid,
          this.teamMember.distribution
        );
      }
    }
  }

  updateGrossValue(idx?: number): void {
    if (idx != undefined) {
      this.invoice.team[idx].locals.grossValue = this.contractService.toGrossValue(
        this.invoice.team[idx].locals.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
      this.updateTeamTotal();
    } else {
      this.teamMember.locals.grossValue = this.contractService.toGrossValue(
        this.teamMember.locals.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
    }
  }

  addColaborator(): void {
    this.invoice.team.push(Object.assign({}, this.teamMember));
    this.userSearch = '';
    this.teamMember = new InvoiceTeamMember();
    this.updateTeamTotal();
    this.memberChanged$.next(true);
  }

  canRemoveMember(index: number): boolean {
    const user = this.invoice.team[index].user;
    if (moneyToNumber(this.contractService.receivedValue(user, this.clonedContract)) > 0) {
      return false;
    }
    if (moneyToNumber(this.contractService.getMemberExpensesSum(user, this.clonedContract)) > 0) {
      return false;
    }
    if (
      !!this.clonedContract.expenses.find((expense) => expense.paid && this.userService.isEqual(expense.source, user))
    ) {
      return false;
    }
    return true;
  }

  isGrossValueOK(): boolean {
    return (
      numberToMoney(
        moneyToNumber(this.teamTotal.grossValue) + this.contractService.getComissionsSum(this.clonedContract)
      ) === removePercentage(this.invoice.value, this.clonedContract.ISS) && this.teamTotal.grossValue !== '0,00'
    );
  }

  isNetValueOK(): boolean {
    return this.teamTotal.netValue === this.clonedContract.locals.liquid && this.teamTotal.netValue !== '0,00';
  }

  updateLiquid(): void {
    this.clonedContract.locals.liquid = this.contractService.contractNetValue(this.clonedContract);
    this.clonedContract.locals.cashback = numberToMoney(
      this.contractService.expensesContributions(this.clonedContract).global.cashback
    );
    if (this.clonedContract.invoice != undefined) {
      const invoice = this.invoiceService.idToInvoice(this.clonedContract.invoice);
      invoice.team.map((member, index) => {
        member.locals.netValue = applyPercentage(this.clonedContract.locals.liquid, member.distribution);
        this.updateGrossValue(index);
        this.updateTeamTotal();
      });
    }
  }

  updateContract(): void {
    let version = +this.clonedContract.version;
    version += 1;
    this.clonedContract.version = version.toString().padStart(2, '0');
    this.clonedContract.lastUpdate = new Date();
    if (this.contract.status !== this.clonedContract.status) {
      const lastStatusIndex = this.clonedContract.statusHistory.length - 1;
      this.clonedContract.statusHistory[lastStatusIndex].end = this.clonedContract.lastUpdate;
      this.clonedContract.statusHistory.push({
        status: this.clonedContract.status,
        start: this.clonedContract.lastUpdate,
      });
    }
    this.contract = cloneDeep(this.clonedContract);
    if (!isEqual(this.contract.invoice, this.invoice)) this.invoiceService.editInvoice(this.invoice);
    this.contractService.editContract(this.contract);
    this.ngForm.form.markAsPristine();
    setTimeout(() => {
      this.isFormDirty.next(false);
    }, 10);
  }

  applyDistribution(): void {
    this.invoice.team = this.invoice.team.map((member) => {
      member.locals.netValue = applyPercentage(this.clonedContract.locals.liquid, member.distribution);
      member.locals.grossValue = this.contractService.toGrossValue(
        member.locals.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
      return member;
    });
  }

  isNotEdited(): boolean {
    return isEqual(omitDeep(this.contract, ['locals']), omitDeep(this.clonedContract, ['locals']));
  }

  onNewMemberSelected(event: User): void {
    this.teamMember.user = event;
    this.USER_SECTORS = this.teamService.userToSectors(this.teamMember.user._id);
    this.teamMember.sector = undefined;
  }
}
