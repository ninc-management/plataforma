import { Component, Input, OnInit } from '@angular/core';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { CLIENT, CONTRACT_BALANCE, UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';

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

  ngOnInit(): void {
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
}
