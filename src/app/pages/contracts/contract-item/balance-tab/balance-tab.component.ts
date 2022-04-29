import { Component, Input, OnInit } from '@angular/core';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { CLIENT, CONTRACT_BALANCE, UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { Subject, takeUntil } from 'rxjs';

interface ExpenseSourceSum {
  user: string;
  value: string;
}

@Component({
  selector: 'ngx-balance-tab',
  templateUrl: './balance-tab.component.html',
  styleUrls: ['./balance-tab.component.scss'],
})
export class BalanceTabComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() responseEvent = new Subject<void>();
  private destroy$ = new Subject<void>();

  comissionSum = '';
  contractId!: string;
  invoice: Invoice = new Invoice();
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

  contractorIcon = {
    icon: 'client',
    pack: 'fac',
  };

  chartIcon = {
    icon: 'chart-bar',
    pack: 'fa',
  };

  constructor(
    public stringUtil: StringUtilService,
    public contractService: ContractService,
    private invoiceService: InvoiceService,
    public utils: UtilsService,
    public userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.responseEvent.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculatePaidValue();
      this.calculateBalance();
    });
    this.contractId = this.contract._id;
    if (this.contract.invoice) this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    this.comissionSum = this.stringUtil.numberToMoney(this.contractService.getComissionsSum(this.contract));
    this.options.interest = this.contract.receipts.length;
    this.options.notaFiscal = this.utils.nfPercentage(this.contract);
    this.options.nortanPercentage = this.utils.nortanPercentage(this.contract);
  }

  expenseSourceSum(): ExpenseSourceSum[] {
    const result = this.contract.expenses.reduce(
      (sum: ExpenseSourceSum[], expense) => {
        if (expense.source != undefined) {
          const source = this.userService.idToShortName(expense.source);
          const idx = sum.findIndex((el) => el.user == source);
          if (idx != -1) sum[idx].value = this.stringUtil.sumMoney(sum[idx].value, expense.value);
        }
        return sum;
      },
      [CONTRACT_BALANCE.fullName, CLIENT.fullName]
        .concat(
          this.invoice.team
            .map((member) => {
              if (member.user) return this.userService.idToShortName(member.user);
              return '';
            })
            .filter((n) => n.length > 0)
        )
        .map((name) => ({ user: name, value: '0,00' }))
    );
    const contractor = result.splice(1, 1)[0];
    const total = result.reduce((sum, expense) => this.stringUtil.sumMoney(sum, expense.value), '0,00');
    result.push({ user: 'TOTAL', value: total });
    result.push(contractor);
    return result;
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

  updateLiquid(): void {
    this.contract.liquid = this.contractService.toNetValue(
      this.contractService.subtractComissions(
        this.stringUtil.removePercentage(this.contract.value, this.contract.ISS),
        this.contract
      ),
      this.options.notaFiscal,
      this.options.nortanPercentage,
      this.contract.created
    );
    this.contract.cashback = this.stringUtil.numberToMoney(
      this.contractService.expensesContributions(this.contract).global.cashback
    );
    if (this.contract.invoice != undefined) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      invoice.team.map((member, index) => {
        member.netValue = this.stringUtil.applyPercentage(this.contract.liquid, member.distribution);
        this.updateGrossValue(index);
        this.updateTeamTotal();
      });
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
    }
  }

  calculatePaidValue(): void {
    this.options.interest = this.contract.receipts.length;
    this.options.notaFiscal = this.utils.nfPercentage(this.contract);
    this.options.nortanPercentage = this.utils.nortanPercentage(this.contract);
    this.updateLiquid();
    this.options.paid = this.contractService.paidValue(this.contract);
    this.contract.notPaid = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(
        this.contractService.toNetValue(
          this.contract.value,
          this.options.notaFiscal,
          this.options.nortanPercentage,
          this.contract.created
        )
      ) - this.stringUtil.moneyToNumber(this.options.paid)
    );
  }

  calculateBalance(): void {
    this.contract.balance = this.contractService.balance(this.contract);
  }
}
