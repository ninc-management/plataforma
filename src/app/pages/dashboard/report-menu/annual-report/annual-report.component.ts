import { Component, OnInit } from '@angular/core';
import { endOfMonth, getMonth, getYear, startOfMonth } from 'date-fns';
import saveAs from 'file-saver';
import { cloneDeep, groupBy } from 'lodash';
import { combineLatest, firstValueFrom, from, map, Observable, skipWhile, take } from 'rxjs';

import { generateUsersReport } from 'app/shared/report-generator';
import { ConfigService, EXPENSE_TYPES } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { INVOICE_STATOOS, InvoiceService } from 'app/shared/services/invoice.service';
import { MetricsService } from 'app/shared/services/metrics.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { TeamService } from 'app/shared/services/team.service';
import { CLIENT, CONTRACT_BALANCE, UserService } from 'app/shared/services/user.service';

import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { User } from '@models/user';

export enum GROUPING_TYPES {
  USER = 'Usuário',
  SECTOR = 'Setor',
  CONTRACT = 'Contrato',
}

enum REPORT_TYPES {
  GERAL = 'Geral',
  NORTAN = 'Suporte Administrativo',
  PESSOAL = 'Administração Pessoal',
}

interface IndividualData {
  received: string;
  expenses: string;
  sent_invoices_manager: number;
  sent_invoices_team: number;
  opened_contracts_manager: number;
  opened_contracts_team: number;
  concluded_contracts_manager: number;
  concluded_contracts_team: number;
}

interface Overview {
  received: string;
  expenses: string;
  to_receive: string;
  sent_invoices_manager: number;
  sent_invoices_team: number;
  opened_contracts_manager: number;
  opened_contracts_team: number;
  concluded_contracts_manager: number;
  concluded_contracts_team: number;
}

export interface ReportValue {
  monthly_data: IndividualData[];
  overview: Overview;
}

const defaultMonthlyData = new Array(12);

@Component({
  selector: 'ngx-annual-report',
  templateUrl: './annual-report.component.html',
  styleUrls: ['./annual-report.component.scss'],
})
export class AnnualReportComponent implements OnInit {
  isGenerating = false;
  selectedReportType = REPORT_TYPES.GERAL;
  selectedGroupingType = GROUPING_TYPES.USER;
  selectedYear!: number;
  groupingTypes = GROUPING_TYPES;
  availableYears = Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (v, k) => 2020 + k);
  availableReportTypes = Object.values(REPORT_TYPES);
  availableGroupingTypes = Object.values(GROUPING_TYPES);

  users: User[] = [];
  config: PlatformConfig = new PlatformConfig();

  constructor(
    private userService: UserService,
    private teamService: TeamService,
    private invoiceService: InvoiceService,
    private contractService: ContractService,
    private metricsService: MetricsService,
    private stringUtil: StringUtilService,
    private configService: ConfigService
  ) {
    for (
      let i = 0;
      i < defaultMonthlyData.length;
      defaultMonthlyData[i++] = {
        received: '0,00',
        expenses: '0,00',
        sent_invoices_manager: 0,
        sent_invoices_team: 0,
        opened_contracts_manager: 0,
        opened_contracts_team: 0,
        concluded_contracts_manager: 0,
        concluded_contracts_team: 0,
      }
    );
  }

  ngOnInit(): void {
    combineLatest([
      this.userService.getUsers(),
      this.configService.getConfig(),
      this.userService.isDataLoaded$,
      this.configService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(([, , isUserDataLoaded, isConfigDataLoaded]) => !(isUserDataLoaded && isConfigDataLoaded)),
        take(1)
      )
      .subscribe(([users, config, ,]) => {
        this.users = users;
        this.config = config[0];
      });
  }

  createReportObject(): Record<string, ReportValue> {
    const data: Record<string, ReportValue> = {};

    this.users.forEach((user) => {
      data[user._id] = {
        monthly_data: cloneDeep(defaultMonthlyData),
        overview: {
          received: '0,00',
          expenses: '0,00',
          to_receive: '0,00',
          sent_invoices_manager: 0,
          sent_invoices_team: 0,
          opened_contracts_manager: 0,
          opened_contracts_team: 0,
          concluded_contracts_manager: 0,
          concluded_contracts_team: 0,
        },
      };
    });

    return cloneDeep(data);
  }

  createReportObjectBySector(): Record<string, ReportValue> {
    const data: Record<string, ReportValue> = {};

    this.teamService.sectorsListAll().forEach((sector) => {
      data[sector._id] = {
        monthly_data: cloneDeep(defaultMonthlyData),
        overview: {
          received: '0,00',
          expenses: '0,00',
          to_receive: '0,00',
          sent_invoices_manager: 0,
          sent_invoices_team: 0,
          opened_contracts_manager: 0,
          opened_contracts_team: 0,
          concluded_contracts_manager: 0,
          concluded_contracts_team: 0,
        },
      };
    });

    return cloneDeep(data);
  }

  computeReportData(type: REPORT_TYPES, year: number): Observable<Record<string, ReportValue>> {
    const data = this.createReportObject();

    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, invoices, ,]) => {
        contracts = contracts.map((contract) => this.contractService.fillContract(contract));
        Object.values(
          groupBy(
            invoices
              .filter((invoice) => {
                let typeFilter = true;
                if (type === REPORT_TYPES.NORTAN && invoice.administration != 'nortan') typeFilter = false;
                if (type === REPORT_TYPES.PESSOAL && invoice.administration == 'nortan') typeFilter = false;
                return getYear(invoice.created) == year && invoice.status != INVOICE_STATOOS.INVALIDADO && typeFilter;
              })
              .map((invoice) => ({ id: invoice._id, month: getMonth(invoice.created) })),
            '1'
          )
        ).forEach((monthInvoices) => {
          monthInvoices.forEach((monthInvoice) => {
            for (const uId of Object.keys(data)) {
              if (this.invoiceService.isInvoiceAuthor(monthInvoice.id, uId)) {
                data[uId].monthly_data[monthInvoice.month].sent_invoices_manager += 1;
                data[uId].overview.sent_invoices_manager += 1;
              } else if (this.invoiceService.isInvoiceMember(monthInvoice.id, uId)) {
                data[uId].monthly_data[monthInvoice.month].sent_invoices_team += 1;
                data[uId].overview.sent_invoices_team += 1;
              }
            }
          });
        });
        Object.values(
          groupBy(
            contracts
              .filter((contract) => {
                if (contract.invoice) {
                  const invoice = this.invoiceService.idToInvoice(contract.invoice);
                  let typeFilter = true;
                  if (type === REPORT_TYPES.NORTAN && invoice.administration != 'nortan') typeFilter = false;
                  if (type === REPORT_TYPES.PESSOAL && invoice.administration == 'nortan') typeFilter = false;
                  return typeFilter;
                }
                return false;
              })
              .map((contract) => ({
                contract: contract,
                month: getMonth(contract.created),
                year: getYear(contract.created),
              })),
            '1'
          )
        ).forEach((monthContracts) => {
          monthContracts.forEach((monthContract) => {
            monthContract.contract.locals.liquid = this.contractService.contractNetValue(monthContract.contract);
            for (const uId of Object.keys(data)) {
              if (this.invoiceService.isInvoiceAuthor(monthContract.contract.invoice as Invoice | string, uId)) {
                if (monthContract.year == year) {
                  data[uId].monthly_data[monthContract.month].opened_contracts_manager += 1;
                  data[uId].overview.opened_contracts_manager += 1;
                }
                if (
                  monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].status ==
                    CONTRACT_STATOOS.CONCLUIDO &&
                  getYear(
                    monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].start
                  ) == year
                ) {
                  const month = getMonth(
                    monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].start
                  );
                  data[uId].monthly_data[month].concluded_contracts_manager += 1;
                  data[uId].overview.concluded_contracts_manager += 1;
                }
              } else if (this.invoiceService.isInvoiceMember(monthContract.contract.invoice as Invoice | string, uId)) {
                if (monthContract.year == year) {
                  data[uId].monthly_data[monthContract.month].opened_contracts_team += 1;
                  data[uId].overview.opened_contracts_team += 1;
                }
                if (
                  monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].status ==
                    CONTRACT_STATOOS.CONCLUIDO &&
                  getYear(
                    monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].start
                  ) == year
                ) {
                  const month = getMonth(
                    monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].start
                  );
                  data[uId].monthly_data[month].concluded_contracts_team += 1;
                  data[uId].overview.concluded_contracts_team += 1;
                }
              }
              // Sum expenses in related months
              Object.values(
                groupBy(
                  monthContract.contract.expenses
                    .filter((expense) => expense.paid && expense.paidDate && getYear(expense.paidDate) == year)
                    .map((expense) => ({ expense: expense, month: getMonth(expense.paidDate as Date) })),
                  '1'
                )
              ).forEach((monthExpenses) => {
                monthExpenses.forEach((monthExpense) => {
                  if (
                    monthExpense.expense.paid &&
                    monthExpense.expense.type !== EXPENSE_TYPES.APORTE &&
                    monthExpense.expense.type !== EXPENSE_TYPES.COMISSAO &&
                    !this.userService.isEqual(monthExpense.expense.source, CONTRACT_BALANCE) &&
                    !this.userService.isEqual(monthExpense.expense.source, CLIENT)
                  ) {
                    const userExpense = monthExpense.expense.team.reduce((sum, member) => {
                      if (this.userService.isEqual(member.user, uId)) {
                        sum = this.stringUtil.sumMoney(sum, member.value);
                      }
                      return sum;
                    }, '0,00');

                    if (userExpense != '0,00') {
                      data[uId].monthly_data[monthExpense.month].expenses = this.stringUtil.sumMoney(
                        data[uId].monthly_data[monthExpense.month].expenses,
                        userExpense
                      );
                      data[uId].overview.expenses = this.stringUtil.sumMoney(data[uId].overview.expenses, userExpense);
                    }
                  }
                });
              });
              // Sum payments in related months
              Object.values(
                groupBy(
                  monthContract.contract.payments
                    .filter((payment) => payment.paid && payment.paidDate && getYear(payment.paidDate) == year)
                    .map((payment) => ({ payment: payment, month: getMonth(payment.paidDate as Date) })),
                  '1'
                )
              ).forEach((monthPayments) => {
                monthPayments.forEach((monthPayment) => {
                  const userPayment = monthPayment.payment.team.reduce((sum, payment) => {
                    if (this.userService.isEqual(payment.user, uId)) {
                      sum = this.stringUtil.sumMoney(sum, payment.value);
                    }
                    return sum;
                  }, '0,00');

                  if (userPayment != '0,00') {
                    data[uId].monthly_data[monthPayment.month].received = this.stringUtil.sumMoney(
                      data[uId].monthly_data[monthPayment.month].received,
                      userPayment
                    );
                    data[uId].overview.received = this.stringUtil.sumMoney(data[uId].overview.received, userPayment);
                  }
                });
              });
              // To receive value
              if (monthContract.contract.invoice) {
                const invoice = this.invoiceService.idToInvoice(monthContract.contract.invoice);
                const memberId = invoice.team.findIndex((member) => this.userService.isEqual(member.user, uId));
                if (memberId != -1) {
                  const toReceive = this.stringUtil.sumMoney(
                    this.contractService.notPaidValue(invoice.team[memberId].distribution, uId, monthContract.contract),
                    this.stringUtil.numberToMoney(
                      this.contractService.expensesContributions(monthContract.contract, uId).user.cashback
                    )
                  );
                  data[uId].overview.to_receive = this.stringUtil.sumMoney(data[uId].overview.to_receive, toReceive);
                }
              }
            }
          });
        });
        return data;
      })
    );
  }

  computeReportDataBySector(type: REPORT_TYPES, year: number): Observable<Record<string, ReportValue>> {
    const data = this.createReportObjectBySector();

    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, invoices, ,]) => {
        contracts = contracts.map((contract) => this.contractService.fillContract(contract));
        Object.values(
          groupBy(
            invoices
              .filter((invoice) => {
                let typeFilter = true;
                if (type === REPORT_TYPES.NORTAN && invoice.administration != 'nortan') typeFilter = false;
                if (type === REPORT_TYPES.PESSOAL && invoice.administration == 'nortan') typeFilter = false;
                return getYear(invoice.created) == year && invoice.status != INVOICE_STATOOS.INVALIDADO && typeFilter;
              })
              .map((invoice) => ({ invoice: invoice, month: getMonth(invoice.created) })),
            '1'
          )
        ).forEach((monthInvoices) => {
          monthInvoices.forEach((monthInvoice) => {
            for (const sector of Object.keys(data)) {
              if (this.teamService.isSectorEqual(monthInvoice.invoice.sector, sector)) {
                data[sector].monthly_data[monthInvoice.month].sent_invoices_manager += 1;
                data[sector].overview.sent_invoices_manager += 1;
              } else if (
                monthInvoice.invoice.team.filter((member) => this.teamService.isSectorEqual(member.sector, sector))
                  .length > 0
              ) {
                data[sector].monthly_data[monthInvoice.month].sent_invoices_team += 1;
                data[sector].overview.sent_invoices_team += 1;
              }
            }
          });
        });
        Object.values(
          groupBy(
            contracts
              .filter((contract) => {
                if (contract.invoice) {
                  const invoice = this.invoiceService.idToInvoice(contract.invoice);
                  let typeFilter = true;
                  if (type === REPORT_TYPES.NORTAN && invoice.administration != 'nortan') typeFilter = false;
                  if (type === REPORT_TYPES.PESSOAL && invoice.administration == 'nortan') typeFilter = false;
                  return typeFilter;
                }
                return false;
              })
              .map((contract) => ({
                contract: contract,
                month: getMonth(contract.created),
                year: getYear(contract.created),
              })),
            '1'
          )
        ).forEach((monthContracts) => {
          monthContracts.forEach((monthContract) => {
            monthContract.contract.locals.liquid = this.contractService.contractNetValue(monthContract.contract);
            for (const sector of Object.keys(data)) {
              if (
                this.teamService.isSectorEqual(
                  this.invoiceService.idToInvoice(monthContract.contract.invoice as Invoice | string).sector,
                  sector
                )
              ) {
                if (monthContract.year == year) {
                  data[sector].monthly_data[monthContract.month].opened_contracts_manager += 1;
                  data[sector].overview.opened_contracts_manager += 1;
                }
                if (
                  monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].status ==
                    CONTRACT_STATOOS.CONCLUIDO &&
                  getYear(
                    monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].start
                  ) == year
                ) {
                  const month = getMonth(
                    monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].start
                  );
                  data[sector].monthly_data[month].concluded_contracts_manager += 1;
                  data[sector].overview.concluded_contracts_manager += 1;
                }
              } else if (
                this.invoiceService
                  .idToInvoice(monthContract.contract.invoice as Invoice | string)
                  .team.filter((member) => this.teamService.isSectorEqual(member.sector, sector)).length > 0
              ) {
                if (monthContract.year == year) {
                  data[sector].monthly_data[monthContract.month].opened_contracts_team += 1;
                  data[sector].overview.opened_contracts_team += 1;
                }
                if (
                  monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].status ==
                    CONTRACT_STATOOS.CONCLUIDO &&
                  getYear(
                    monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].start
                  ) == year
                ) {
                  const month = getMonth(
                    monthContract.contract.statusHistory[monthContract.contract.statusHistory.length - 1].start
                  );
                  data[sector].monthly_data[month].concluded_contracts_team += 1;
                  data[sector].overview.concluded_contracts_team += 1;
                }
              }
              // Sum expenses in related months
              Object.values(
                groupBy(
                  monthContract.contract.expenses
                    .filter((expense) => expense.paid && expense.paidDate && getYear(expense.paidDate) == year)
                    .map((expense) => ({ expense: expense, month: getMonth(expense.paidDate as Date) })),
                  '1'
                )
              ).forEach((monthExpenses) => {
                monthExpenses.forEach((monthExpense) => {
                  if (
                    monthExpense.expense.paid &&
                    monthExpense.expense.type !== EXPENSE_TYPES.APORTE &&
                    monthExpense.expense.type !== EXPENSE_TYPES.COMISSAO &&
                    !this.userService.isEqual(monthExpense.expense.source, CONTRACT_BALANCE) &&
                    !this.userService.isEqual(monthExpense.expense.source, CLIENT)
                  ) {
                    const userExpense = monthExpense.expense.team.reduce((sum, member) => {
                      if (this.teamService.isSectorEqual(member.sector, sector)) {
                        sum = this.stringUtil.sumMoney(sum, member.value);
                      }
                      return sum;
                    }, '0,00');

                    if (userExpense != '0,00') {
                      data[sector].monthly_data[monthExpense.month].expenses = this.stringUtil.sumMoney(
                        data[sector].monthly_data[monthExpense.month].expenses,
                        userExpense
                      );
                      data[sector].overview.expenses = this.stringUtil.sumMoney(
                        data[sector].overview.expenses,
                        userExpense
                      );
                    }
                  }
                });
              });
              // Sum payments in related months
              Object.values(
                groupBy(
                  monthContract.contract.payments
                    .filter((payment) => payment.paid && payment.paidDate && getYear(payment.paidDate) == year)
                    .map((payment) => ({ payment: payment, month: getMonth(payment.paidDate as Date) })),
                  '1'
                )
              ).forEach((monthPayments) => {
                monthPayments.forEach((monthPayment) => {
                  const userPayment = monthPayment.payment.team.reduce((sum, payment) => {
                    if (this.teamService.isSectorEqual(payment.sector, sector)) {
                      sum = this.stringUtil.sumMoney(sum, payment.value);
                    }
                    return sum;
                  }, '0,00');

                  if (userPayment != '0,00') {
                    data[sector].monthly_data[monthPayment.month].received = this.stringUtil.sumMoney(
                      data[sector].monthly_data[monthPayment.month].received,
                      userPayment
                    );
                    data[sector].overview.received = this.stringUtil.sumMoney(
                      data[sector].overview.received,
                      userPayment
                    );
                  }
                });
              });
              // To receive value
              if (monthContract.contract.invoice) {
                const invoice = this.invoiceService.idToInvoice(monthContract.contract.invoice);
                invoice.team.forEach((member) => {
                  if (this.teamService.isSectorEqual(member.sector, sector)) {
                    const toReceive = this.stringUtil.sumMoney(
                      this.contractService.notPaidValue(member.distribution, member.user, monthContract.contract),
                      this.stringUtil.numberToMoney(
                        this.contractService.expensesContributions(monthContract.contract, member.user).user.cashback
                      )
                    );
                    data[sector].overview.to_receive = this.stringUtil.sumMoney(
                      data[sector].overview.to_receive,
                      toReceive
                    );
                  }
                });
              }
            }
          });
        });
        return data;
      })
    );
  }

  async contractsYearReview(year: number): Promise<string> {
    const tmp = [];
    for (let i = 0; i < 12; i++) {
      const start = startOfMonth(new Date(year, i));
      const end = endOfMonth(new Date(year, i));
      tmp.push({
        Recebido: this.stringUtil.numberToMoney(
          await firstValueFrom(
            this.metricsService.nortanValue(start, end, 'oe').pipe(map((metricInfo) => metricInfo.global))
          )
        ),
        Repassado: this.stringUtil.numberToMoney(
          await firstValueFrom(
            this.metricsService.receivedValueNortan(start, end).pipe(map((metricInfo) => metricInfo.global))
          )
        ),
        'Taxa Nortan': this.stringUtil.numberToMoney(
          await firstValueFrom(this.metricsService.nortanValue(start, end).pipe(map((metricInfo) => metricInfo.global)))
        ),
        Impostos: this.stringUtil.numberToMoney(
          await firstValueFrom(
            this.metricsService.nortanValue(start, end, 'taxes').pipe(map((metricInfo) => metricInfo.global))
          )
        ),
      });
    }

    // CSV
    const header = [
      '',
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const rows = ['Recebido', 'Repassado', 'Taxa Nortan', 'Impostos'];
    let csv = header.join(';');
    csv += '\r\n';

    for (const rowName of rows) {
      csv += rowName;
      tmp.forEach((monthData: any) => {
        csv += ';' + monthData[rowName];
      });
      csv += '\r\n';
    }

    return csv;
  }

  downloadReport(): void {
    this.isGenerating = true;
    setTimeout(() => {
      if (this.selectedGroupingType == GROUPING_TYPES.CONTRACT) {
        from(this.contractsYearReview(this.selectedYear)).subscribe((csv: string) => {
          const blob = new Blob([csv], { type: 'text/csv' });
          saveAs(blob, `Relatorio Taxas ${this.selectedYear}.csv`);
          this.isGenerating = false;
        });
      } else {
        (this.selectedGroupingType == GROUPING_TYPES.SECTOR
          ? this.computeReportDataBySector(this.selectedReportType as REPORT_TYPES, this.selectedYear)
          : this.computeReportData(this.selectedReportType as REPORT_TYPES, this.selectedYear)
        )
          .pipe(take(1))
          .subscribe((data: Record<string, ReportValue>) => {
            const csv = generateUsersReport(
              data,
              this.selectedGroupingType as GROUPING_TYPES,
              this.userService.idToUser.bind(this.userService),
              this.teamService.idToSectorComposedName.bind(this.teamService)
            );

            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, `Relatorio ${this.selectedReportType} ${this.selectedYear}.csv`);
            this.isGenerating = false;
          });
      }
    }, 200);
  }

  shouldDisableDownloadButton(): boolean {
    return (
      !this.selectedGroupingType || !this.selectedReportType || this.selectedYear == undefined || this.isGenerating
    );
  }
}
