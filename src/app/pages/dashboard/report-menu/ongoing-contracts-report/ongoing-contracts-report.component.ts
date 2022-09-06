import { Component, OnInit } from '@angular/core';
import { getYear } from 'date-fns';
import saveAs from 'file-saver';
import { combineLatest, skipWhile, take } from 'rxjs';

import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { codeSort, idToProperty, nfPercentage, nortanPercentage } from 'app/shared/utils';

import { Contract, ContractLocals } from '@models/contract';
import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { Team } from '@models/team';

@Component({
  selector: 'ngx-ongoing-contracts-report',
  templateUrl: './ongoing-contracts-report.component.html',
  styleUrls: ['./ongoing-contracts-report.component.scss'],
})
export class OngoingContractsReportComponent implements OnInit {
  selectedTeam = '';
  avaliableTeams: Team[] = [];
  config: PlatformConfig = new PlatformConfig();
  contracts: Contract[] = [];

  constructor(
    private teamService: TeamService,
    private contractService: ContractService,
    private stringUtil: StringUtilService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    private userService: UserService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.configService.getConfig(),
      this.teamService.getTeams(),
      this.contractService.getContracts(),
      this.teamService.isDataLoaded$,
      this.configService.isDataLoaded$,
      this.contractService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([, , isTeamDataLoaded, isConfigDataLoaded, isContractDataLoaded]) =>
            !(isTeamDataLoaded && isConfigDataLoaded && isContractDataLoaded)
        ),
        take(1)
      )
      .subscribe(([config, teams, contracts, , ,]) => {
        this.avaliableTeams = teams;
        this.config = config[0];
        this.contracts = contracts.map((contract) => this.contractService.fillContract(contract));
      });
  }

  getReportReceivedValue(contract: Contract): string {
    return this.contractService.toNetValue(
      this.stringUtil.numberToMoney(
        contract.receipts.reduce((accumulator: number, recipt: any) => {
          if (recipt.paid) accumulator = accumulator + this.stringUtil.moneyToNumber(recipt.value);
          return accumulator;
        }, 0)
      ),
      nfPercentage(contract, this.config.invoiceConfig),
      nortanPercentage(contract, this.config.invoiceConfig),
      contract.created
    );
  }

  getReportExpensesValue(contract: Contract): string {
    const filteredExpenses = contract.expenses.filter((expense) => {
      return expense.paid && expense.paidDate && getYear(expense.paidDate) == 2021;
    });

    let totalExpenseValue = '0,00';
    filteredExpenses.map((expense) => {
      totalExpenseValue = this.stringUtil.sumMoney(totalExpenseValue, expense.value);
    });

    return totalExpenseValue;
  }

  getReportContractNotPaid(contract: Contract, invoice: Invoice): string {
    const paidValue = this.contractService.toNetValue(
      this.stringUtil.numberToMoney(
        contract.receipts.reduce((accumulator: number, recipt: any) => {
          if (recipt.paid) accumulator = accumulator + this.stringUtil.moneyToNumber(recipt.value);
          return accumulator;
        }, 0)
      ),
      nfPercentage(contract, this.config.invoiceConfig),
      nortanPercentage(contract, this.config.invoiceConfig),
      contract.created
    );

    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(
        this.contractService.toNetValue(
          invoice.value,
          nfPercentage(contract, this.config.invoiceConfig),
          nortanPercentage(contract, this.config.invoiceConfig),
          contract.created
        )
      ) - this.stringUtil.moneyToNumber(paidValue)
    );
  }

  createReportObject(contracts: Contract[]): string {
    const mainHeaders = [
      'Nº do Contrato',
      'Cliente',
      'Empreendimento',
      'Valor Bruto do Contrato',
      'Total de Comissões',
      'Valor Liquido do Contrato',
      'Valor Recebido',
      'Total de Despesas',
      'Saldo',
      'R$ em Caixa',
      'Time',
    ];

    const subHeaders = [
      '',
      'Responsável',
      'Situação',
      'Data Prevista da Entrega',
      'Data da Entrega',
      'IFC ou .RVT no Onedrive?',
      '% Conclusão',
    ];

    let csv = mainHeaders.join(';') + '\r\n';

    contracts
      .sort((a, b) => codeSort(1, a.locals.code, b.locals.code))
      .forEach((contract) => {
        if (contract.invoice) {
          const invoice = this.invoiceService.idToInvoice(contract.invoice);
          csv += invoice.code + ';';
          csv +=
            idToProperty(
              invoice.contractor,
              this.contractorService.idToContractor.bind(this.contractorService),
              'fullName'
            ) + ';';
          csv += invoice.name + ';';
          csv += invoice.value + ';';
          csv += this.contractService.getComissionsSum(contract) + ';';
          csv +=
            this.contractService.toNetValue(
              this.contractService.subtractComissions(
                this.stringUtil.removePercentage(invoice.value, contract.ISS),
                contract
              ),
              nfPercentage(contract, this.config.invoiceConfig),
              nortanPercentage(contract, this.config.invoiceConfig),
              contract.created
            ) + ';';
          csv += this.getReportReceivedValue(contract) + ';';
          csv += this.getReportExpensesValue(contract) + ';';
          csv += this.getReportContractNotPaid(contract, invoice) + ';';
          csv += this.contractService.balance(contract) + ';';
          csv += invoice.team
            .map((member) => {
              idToProperty(member.user, this.userService.idToUser.bind(this.userService), 'fullName');
            })
            .join(', ');
          csv += '\r\n';
          csv += subHeaders.join(';') + '\r\n';
          csv += invoice.products.map((product) => product.name).join('\r\n') + '\r\n';
          csv += '\r\n';
        }
      });

    return csv;
  }

  downloadReport(): void {
    const filteredContracts = this.contracts.filter((contract) => {
      if (contract.invoice) {
        const invoice = this.invoiceService.idToInvoice(contract.invoice);
        return (
          this.teamService.isTeamEqual(invoice.nortanTeam, this.selectedTeam) &&
          contract.status != CONTRACT_STATOOS.ARQUIVADO &&
          contract.status != CONTRACT_STATOOS.CONCLUIDO
        );
      }
      return false;
    });

    const csv = this.createReportObject(filteredContracts);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'relatorio_' + this.teamService.idToTeam(this.selectedTeam).abrev.toLowerCase() + '.csv');
  }
}
