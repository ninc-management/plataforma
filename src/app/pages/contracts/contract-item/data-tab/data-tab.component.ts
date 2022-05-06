import { Component, Input, OnInit } from '@angular/core';
import { Contract } from '@models/contract';
import { BehaviorSubject, combineLatest, map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import * as contract_validation from 'app/shared/contract-validation.json';
import { ContractService, CONTRACT_STATOOS, EXPENSE_TYPES } from 'app/shared/services/contract.service';
import { Invoice } from '@models/invoice';
import { TeamService } from 'app/shared/services/team.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { cloneDeep, isEqual } from 'lodash';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { Sector } from '@models/shared';
import { User } from '@models/user';
import { UserService } from 'app/shared/services/user.service';
import { LocalDataSource } from 'ng2-smart-table';

@Component({
  selector: 'ngx-data-tab',
  templateUrl: './data-tab.component.html',
  styleUrls: ['./data-tab.component.scss'],
})
export class DataTabComponent implements OnInit {
  private destroy$ = new Subject<void>();
  @Input() contract: Contract = new Contract();
  @Input() clonedContract: Contract = new Contract();
  @Input() responseEvent = new Subject<void>();
  isEditionGranted = false;
  validation = (contract_validation as any).default;
  STATOOS = Object.values(CONTRACT_STATOOS);
  EXPENSE_OPTIONS = Object.values(EXPENSE_TYPES);
  INTERESTS = [...Array(24).keys()].map((index) => (index + 1).toString());
  invoice: Invoice = new Invoice();
  comissionSum = '';
  today = new Date();
  userSearch = '';
  teamMember: any = {};
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
  availableUsers: Observable<User[]> = of([]);

  get invoiceAdministration(): string {
    if (this.contract.invoice) return this.invoiceService.idToInvoice(this.contract.invoice).administration;
    return '';
  }
  source: LocalDataSource = new LocalDataSource();

  constructor(
    public teamService: TeamService,
    public utils: UtilsService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    public stringUtil: StringUtilService,
    private contractService: ContractService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.options.interest = this.contract.receipts.length;
    this.options.paid = this.contractService.paidValue(this.contract);
    if (this.clonedContract.invoice) this.invoice = this.invoiceService.idToInvoice(this.clonedContract.invoice);
    this.comissionSum = this.stringUtil.numberToMoney(this.contractService.getComissionsSum(this.clonedContract));
    this.availableUsers = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) => {
        return users.filter((user) => !this.userService.isUserInTeam(user, this.invoice.team) && user.active);
      })
    );
    this.responseEvent.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.options.interest = this.contract.receipts.length;
      this.options.paid = this.contractService.paidValue(this.contract);
    });
    this.contractService
      .checkEditPermission(this.invoice)
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isEditionGranted = isGranted;
      });
    this.contractService.edited$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => {
        this.clonedContract.status = this.contract.status;
      }, 100);
    });
    if (this.clonedContract.ISS) {
      if (this.stringUtil.moneyToNumber(this.clonedContract.ISS) == 0) this.options.hasISS = false;
      else this.options.hasISS = true;
    } else {
      this.clonedContract.ISS = '0,00';
      this.options.hasISS = false;
    }
    this.updateLiquid();
    this.updateTeamTotal();
    this.applyDistribution();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  tooltipText(): string {
    if (this.contract.invoice) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      if (invoice.contractor)
        return (
          `CPF/CNPJ: ` +
          this.contractorService.idToContractor(invoice.contractor).document +
          `\nTelefone: ` +
          this.contractorService.idToContractor(invoice.contractor).phone +
          `\nEmail: ` +
          this.contractorService.idToContractor(invoice.contractor).email +
          `\nEndereço: ` +
          this.contractorService.idToContractor(invoice.contractor).address
        );
    }
    return '';
  }

  updateTeamTotal(): void {
    this.teamTotal = this.invoice.team.reduce(
      (sum, member) => {
        sum.grossValue = this.stringUtil.sumMoney(sum.grossValue, member.grossValue);
        sum.netValue = this.stringUtil.sumMoney(sum.netValue, member.netValue);
        sum.distribution = this.stringUtil.sumMoney(sum.distribution, member.distribution);
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
      this.invoice.team[idx].distribution = this.stringUtil
        .toPercentage(this.invoice.team[idx].netValue, this.clonedContract.liquid, 20)
        .slice(0, -1);
      this.updateTeamTotal();
    } else {
      this.teamMember.distribution = this.stringUtil
        .toPercentage(this.teamMember.netValue, this.clonedContract.liquid, 20)
        .slice(0, -1);
    }
  }

  updateNetValue(idx?: number, source: 'gross' | 'distribution' = 'distribution'): void {
    if (idx != undefined) {
      if (source === 'gross') {
        this.invoice.team[idx].netValue = this.contractService.toNetValue(
          this.invoice.team[idx].grossValue,
          this.options.notaFiscal,
          this.options.nortanPercentage,
          this.clonedContract.created
        );
      } else {
        this.invoice.team[idx].netValue = this.stringUtil.applyPercentage(
          this.clonedContract.liquid,
          this.invoice.team[idx].distribution
        );
      }
      this.updateTeamTotal();
    } else {
      if (source === 'gross') {
        this.teamMember.netValue = this.contractService.toNetValue(
          this.teamMember.grossValue,
          this.options.notaFiscal,
          this.options.nortanPercentage,
          this.clonedContract.created
        );
      } else {
        this.teamMember.netValue = this.stringUtil.applyPercentage(
          this.clonedContract.liquid,
          this.teamMember.distribution
        );
      }
    }
  }

  updateGrossValue(idx?: number): void {
    if (idx != undefined) {
      this.invoice.team[idx].grossValue = this.contractService.toGrossValue(
        this.invoice.team[idx].netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
      this.updateTeamTotal();
    } else {
      this.teamMember.grossValue = this.contractService.toGrossValue(
        this.teamMember.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
    }
  }

  addColaborator(): void {
    this.invoice.team.push(Object.assign({}, this.teamMember));
    this.userSearch = '';
    this.teamMember = {};
    this.updateTeamTotal();
    this.memberChanged$.next(true);
  }

  canRemoveMember(index: number): boolean {
    const user = this.invoice.team[index].user;
    if (this.stringUtil.moneyToNumber(this.contractService.receivedValue(user, this.clonedContract)) > 0) {
      return false;
    }
    if (this.stringUtil.moneyToNumber(this.contractService.getMemberExpensesSum(user, this.clonedContract)) > 0) {
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
      this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(this.teamTotal.grossValue) +
          this.contractService.getComissionsSum(this.clonedContract)
      ) === this.stringUtil.removePercentage(this.clonedContract.value, this.clonedContract.ISS) &&
      this.teamTotal.grossValue !== '0,00'
    );
  }

  isNetValueOK(): boolean {
    return this.teamTotal.netValue === this.clonedContract.liquid && this.teamTotal.netValue !== '0,00';
  }

  updateLiquid(): void {
    this.clonedContract.liquid = this.contractService.toNetValue(
      this.contractService.subtractComissions(
        this.stringUtil.removePercentage(this.clonedContract.value, this.clonedContract.ISS),
        this.clonedContract
      ),
      this.options.notaFiscal,
      this.options.nortanPercentage,
      this.clonedContract.created
    );
    this.clonedContract.cashback = this.stringUtil.numberToMoney(
      this.contractService.expensesContributions(this.clonedContract).global.cashback
    );
    if (this.clonedContract.invoice != undefined) {
      const invoice = this.invoiceService.idToInvoice(this.clonedContract.invoice);
      invoice.team.map((member, index) => {
        member.netValue = this.stringUtil.applyPercentage(this.clonedContract.liquid, member.distribution);
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
    this.invoiceService.editInvoice(this.invoice);
    this.contractService.editContract(this.contract);
  }

  applyDistribution(): void {
    this.invoice.team = this.invoice.team.map((member) => {
      member.netValue = this.stringUtil.applyPercentage(this.clonedContract.liquid, member.distribution);
      member.grossValue = this.contractService.toGrossValue(
        member.netValue,
        this.options.notaFiscal,
        this.options.nortanPercentage
      );
      return member;
    });
  }

  isNotEdited(): boolean {
    return isEqual(this.contract, this.clonedContract);
  }
}
