import { Component, OnInit } from '@angular/core';
import { endOfMonth, getMonth, getYear, startOfMonth } from 'date-fns';
import saveAs from 'file-saver';
import { cloneDeep, groupBy } from 'lodash';
import { combineLatest, firstValueFrom, from, map, Observable, skipWhile, take } from 'rxjs';

import {
  EXCLUDED_EXPENSE_TYPES,
  EXCLUDED_TYPOLOGIES,
  generateTeamsReport,
  generateUsersReport,
} from 'app/shared/report-generator';
import { ConfigService, EXPENSE_TYPES } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { INVOICE_STATOOS, InvoiceService } from 'app/shared/services/invoice.service';
import { MetricsService } from 'app/shared/services/metrics.service';
import { TeamService } from 'app/shared/services/team.service';
import { CLIENT, CONTRACT_BALANCE, UserService } from 'app/shared/services/user.service';
import { applyPercentage, numberToMoney, subtractMoney, sumMoney } from 'app/shared/string-utils';
import { getIntersectionBetweenDates } from 'app/shared/utils';

import { Contract, ContractExpense, ContractPayment, ContractReceipt } from '@models/contract';
import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { Team } from '@models/team';
import { User } from '@models/user';

export enum GROUPING_TYPES {
  USER = 'Usuário',
  SECTOR = 'Setor',
  CONTRACT = 'Contrato',
  TEAMS = 'Time',
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

export interface TeamData {
  support_organization: string;
  support_personal: string;
  oe_gross: string;
  oe_net: string;
  oe_nf: string;
  oe_organization: string;
  op: string;
  expenses: string;
  expenses_total: string;
  net_balance: string;
  sent_invoices: number;
  sent_invoices_value: string;
  concluded_invoices: number;
  concluded_invoices_value: string;
  convertion_time: number;
  balance: string;
  not_paid: string;
  ongoing_contracts: number;
  ongoing_oe: number;
  ongoing_oe_value: string;
  ongoing_invoice: number;
  ongoing_invoice_value: string;
}

const defaultMonthlyData = new Array<IndividualData>(12);
const defaultTeamMonthlyData = new Array<TeamData>(12);

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

  getIntersectionBetweenDates = getIntersectionBetweenDates;

  users: User[] = [];
  teams: Team[] = [];
  config: PlatformConfig = new PlatformConfig();

  constructor(
    private userService: UserService,
    private teamService: TeamService,
    private invoiceService: InvoiceService,
    private contractService: ContractService,
    private metricsService: MetricsService,
    private configService: ConfigService
  ) {
    for (let i = 0; i < defaultMonthlyData.length; i++) {
      defaultMonthlyData[i] = {
        received: '0,00',
        expenses: '0,00',
        sent_invoices_manager: 0,
        sent_invoices_team: 0,
        opened_contracts_manager: 0,
        opened_contracts_team: 0,
        concluded_contracts_manager: 0,
        concluded_contracts_team: 0,
      };
      defaultTeamMonthlyData[i] = {
        support_organization: '0,00',
        support_personal: '0,00',
        oe_gross: '0,00',
        oe_net: '0,00',
        oe_nf: '0,00',
        oe_organization: '0,00',
        op: '0,00',
        expenses: '0,00',
        expenses_total: '0,00',
        net_balance: '0,00',
        sent_invoices: 0,
        sent_invoices_value: '0,00',
        concluded_invoices: 0,
        concluded_invoices_value: '0,00',
        convertion_time: 0,
        balance: '0,00',
        not_paid: '0,00',
        ongoing_contracts: 0,
        ongoing_oe: 0,
        ongoing_oe_value: '0,00',
        ongoing_invoice: 0,
        ongoing_invoice_value: '0,00',
      };
    }
  }

  ngOnInit(): void {
    combineLatest([
      this.userService.getUsers(),
      this.configService.getConfig(),
      this.teamService.getTeams(),
      this.userService.isDataLoaded$,
      this.configService.isDataLoaded$,
      this.teamService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([, , isUserDataLoaded, isConfigDataLoaded, isTeamDataLoaded]) =>
            !(isUserDataLoaded && isConfigDataLoaded && isTeamDataLoaded)
        ),
        take(1)
      )
      .subscribe(([users, config, teams, , ,]) => {
        this.users = users;
        this.teams = teams;
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

  createTeamReportObject(): Record<string, TeamData[]> {
    const data: Record<string, TeamData[]> = {};

    this.teams.forEach((team) => {
      data[team._id] = cloneDeep(defaultTeamMonthlyData);
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
        const invoicesByMonth = Object.values(
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
        ) as { id: string; month: number }[][];
        invoicesByMonth.forEach((monthInvoices) => {
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
        const contractsByYear = Object.values(
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
        ) as { contract: Contract; month: number; year: number }[][];
        contractsByYear.forEach((monthContracts) => {
          monthContracts.forEach((monthContract) => {
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
              const expensesByMonth = Object.values(
                groupBy(
                  monthContract.contract.expenses
                    .filter(
                      (expense) =>
                        expense.paid &&
                        expense.paidDate &&
                        getYear(expense.paidDate) == year &&
                        expense.type != EXCLUDED_EXPENSE_TYPES.TRANSFER
                    )
                    .map((expense) => ({ expense: expense, month: getMonth(expense.paidDate as Date) })),
                  '1'
                )
              ) as { expense: ContractExpense; month: number }[][];
              expensesByMonth.forEach((monthExpenses) => {
                monthExpenses.forEach((monthExpense) => {
                  if (
                    monthExpense.expense.type !== EXPENSE_TYPES.APORTE &&
                    monthExpense.expense.type !== EXPENSE_TYPES.COMISSAO &&
                    !this.userService.isEqual(monthExpense.expense.source, CONTRACT_BALANCE) &&
                    !this.userService.isEqual(monthExpense.expense.source, CLIENT)
                  ) {
                    const userExpense = monthExpense.expense.team.reduce((sum, member) => {
                      if (this.userService.isEqual(member.user, uId)) {
                        sum = sumMoney(sum, member.value);
                      }
                      return sum;
                    }, '0,00');

                    if (userExpense != '0,00') {
                      data[uId].monthly_data[monthExpense.month].expenses = sumMoney(
                        data[uId].monthly_data[monthExpense.month].expenses,
                        userExpense
                      );
                      data[uId].overview.expenses = sumMoney(data[uId].overview.expenses, userExpense);
                    }
                  }
                });
              });
              // Sum payments in related months
              const paymentsByMonth = Object.values(
                groupBy(
                  monthContract.contract.payments
                    .filter((payment) => payment.paid && payment.paidDate && getYear(payment.paidDate) == year)
                    .map((payment) => ({ payment: payment, month: getMonth(payment.paidDate as Date) })),
                  '1'
                )
              ) as { payment: ContractPayment; month: number }[][];
              paymentsByMonth.forEach((monthPayments) => {
                monthPayments.forEach((monthPayment) => {
                  const userPayment = monthPayment.payment.team.reduce((sum, payment) => {
                    if (this.userService.isEqual(payment.user, uId)) {
                      sum = sumMoney(sum, payment.value);
                    }
                    return sum;
                  }, '0,00');

                  if (userPayment != '0,00') {
                    data[uId].monthly_data[monthPayment.month].received = sumMoney(
                      data[uId].monthly_data[monthPayment.month].received,
                      userPayment
                    );
                    data[uId].overview.received = sumMoney(data[uId].overview.received, userPayment);
                  }
                });
              });
              // To receive value
              if (monthContract.contract.invoice) {
                const invoice = this.invoiceService.idToInvoice(monthContract.contract.invoice);
                const memberId = invoice.team.findIndex((member) => this.userService.isEqual(member.user, uId));
                if (memberId != -1) {
                  const toReceive = sumMoney(
                    this.contractService.notPaidValue(invoice.team[memberId].distribution, uId, monthContract.contract),
                    numberToMoney(this.contractService.expensesContributions(monthContract.contract, uId).user.cashback)
                  );
                  data[uId].overview.to_receive = sumMoney(data[uId].overview.to_receive, toReceive);
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
        const invoicesByMonth = Object.values(
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
        ) as { invoice: Invoice; month: number }[][];
        invoicesByMonth.forEach((monthInvoices) => {
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
        const contractsByYear = Object.values(
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
        ) as { contract: Contract; month: number; year: number }[][];
        contractsByYear.forEach((monthContracts) => {
          monthContracts.forEach((monthContract) => {
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
              const expensesByMonth = Object.values(
                groupBy(
                  monthContract.contract.expenses
                    .filter(
                      (expense) =>
                        expense.paid &&
                        expense.paidDate &&
                        getYear(expense.paidDate) == year &&
                        expense.type != EXCLUDED_EXPENSE_TYPES.TRANSFER
                    )
                    .map((expense) => ({ expense: expense, month: getMonth(expense.paidDate as Date) })),
                  '1'
                )
              ) as { expense: ContractExpense; month: number }[][];
              expensesByMonth.forEach((monthExpenses) => {
                monthExpenses.forEach((monthExpense) => {
                  if (
                    monthExpense.expense.type !== EXPENSE_TYPES.APORTE &&
                    monthExpense.expense.type !== EXPENSE_TYPES.COMISSAO &&
                    !this.userService.isEqual(monthExpense.expense.source, CONTRACT_BALANCE) &&
                    !this.userService.isEqual(monthExpense.expense.source, CLIENT)
                  ) {
                    const userExpense = monthExpense.expense.team.reduce((sum, member) => {
                      if (this.teamService.isSectorEqual(member.sector, sector)) {
                        sum = sumMoney(sum, member.value);
                      }
                      return sum;
                    }, '0,00');

                    if (userExpense != '0,00') {
                      data[sector].monthly_data[monthExpense.month].expenses = sumMoney(
                        data[sector].monthly_data[monthExpense.month].expenses,
                        userExpense
                      );
                      data[sector].overview.expenses = sumMoney(data[sector].overview.expenses, userExpense);
                    }
                  }
                });
              });
              // Sum payments in related months
              const paymentsByMonth = Object.values(
                groupBy(
                  monthContract.contract.payments
                    .filter((payment) => payment.paid && payment.paidDate && getYear(payment.paidDate) == year)
                    .map((payment) => ({ payment: payment, month: getMonth(payment.paidDate as Date) })),
                  '1'
                )
              ) as { payment: ContractPayment; month: number }[][];
              paymentsByMonth.forEach((monthPayments) => {
                monthPayments.forEach((monthPayment) => {
                  const userPayment = monthPayment.payment.team.reduce((sum, payment) => {
                    if (this.teamService.isSectorEqual(payment.sector, sector)) {
                      sum = sumMoney(sum, payment.value);
                    }
                    return sum;
                  }, '0,00');

                  if (userPayment != '0,00') {
                    data[sector].monthly_data[monthPayment.month].received = sumMoney(
                      data[sector].monthly_data[monthPayment.month].received,
                      userPayment
                    );
                    data[sector].overview.received = sumMoney(data[sector].overview.received, userPayment);
                  }
                });
              });
              // To receive value
              if (monthContract.contract.invoice) {
                const invoice = this.invoiceService.idToInvoice(monthContract.contract.invoice);
                invoice.team.forEach((member) => {
                  if (this.teamService.isSectorEqual(member.sector, sector)) {
                    const toReceive = sumMoney(
                      this.contractService.notPaidValue(member.distribution, member.user, monthContract.contract),
                      numberToMoney(
                        this.contractService.expensesContributions(monthContract.contract, member.user).user.cashback
                      )
                    );
                    data[sector].overview.to_receive = sumMoney(data[sector].overview.to_receive, toReceive);
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

  computeReportDataByTeam(year: number): Observable<Record<string, TeamData[]>> {
    const data = this.createTeamReportObject();

    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, invoices, ,]) => {
        contracts = contracts.map((contract) => this.contractService.fillContract(contract));
        const invoicesByMonth = Object.values(
          groupBy(
            invoices
              .filter((invoice) => {
                return invoice.status != INVOICE_STATOOS.INVALIDADO;
              })
              .map((invoice) => ({ invoice: invoice, month: getMonth(invoice.created) })),
            '1'
          )
        ) as { invoice: Invoice; month: number }[][];
        invoicesByMonth.forEach((monthInvoices) => {
          monthInvoices.forEach((monthInvoice) => {
            for (const team of Object.keys(data)) {
              if (
                this.teamService.isTeamEqual(monthInvoice.invoice.nortanTeam, team) &&
                getYear(monthInvoice.invoice.created) == year
              ) {
                data[team][monthInvoice.month].sent_invoices += 1;
                data[team][monthInvoice.month].sent_invoices_value = sumMoney(
                  data[team][monthInvoice.month].sent_invoices_value,
                  monthInvoice.invoice.value
                );
                if (
                  monthInvoice.invoice.status == INVOICE_STATOOS.FECHADO &&
                  getYear(monthInvoice.invoice.created) == year
                ) {
                  data[team][monthInvoice.month].concluded_invoices += 1;
                  data[team][monthInvoice.month].concluded_invoices_value = sumMoney(
                    data[team][monthInvoice.month].concluded_invoices_value,
                    monthInvoice.invoice.value
                  );
                }
                if (
                  monthInvoice.invoice.status == INVOICE_STATOOS.EM_ANALISE &&
                  getYear(monthInvoice.invoice.created) <= year
                ) {
                  //TODO: count invoices by status history
                  let month = monthInvoice.month;
                  if (getYear(monthInvoice.invoice.created) < year) month = 0;
                  data[team][month].ongoing_invoice += 1;
                  data[team][month].ongoing_invoice_value = sumMoney(
                    data[team][month].ongoing_invoice_value,
                    monthInvoice.invoice.value
                  );
                }
              }
            }
          });
        });
        const contractsByYear = Object.values(
          groupBy(
            contracts.map((contract) => ({
              contract: contract,
              month: getMonth(contract.created),
              year: getYear(contract.created),
            })),
            '1'
          )
        ) as { contract: Contract; month: number; year: number }[][];
        contractsByYear.forEach((monthContracts) => {
          monthContracts.forEach((monthContract) => {
            for (const team of Object.keys(data)) {
              if (
                this.teamService.isTeamEqual(
                  this.invoiceService.idToInvoice(monthContract.contract.invoice as Invoice | string).nortanTeam,
                  team
                )
              ) {
                if (
                  monthContract.year <= year &&
                  [CONTRACT_STATOOS.A_RECEBER, CONTRACT_STATOOS.EM_ANDAMENTO].includes(
                    monthContract.contract.status as CONTRACT_STATOOS
                  )
                ) {
                  //TODO: count invoices by status history
                  let month = monthContract.month;
                  if (getYear(monthContract.contract.created) < year) month = 0;
                  data[team][month].ongoing_contracts += 1;
                }
                // Sum expenses in related months
                const expensesByMonth = Object.values(
                  groupBy(
                    monthContract.contract.expenses
                      .filter(
                        (expense) =>
                          expense.paid &&
                          expense.paidDate &&
                          getYear(expense.paidDate) == year &&
                          expense.type != EXCLUDED_EXPENSE_TYPES.TRANSFER
                      )
                      .map((expense) => ({ expense: expense, month: getMonth(expense.paidDate as Date) })),
                    '1'
                  )
                ) as { expense: ContractExpense; month: number }[][];
                expensesByMonth.forEach((monthExpenses) => {
                  monthExpenses.forEach((monthExpense) => {
                    if (
                      monthExpense.expense.type !== EXPENSE_TYPES.APORTE &&
                      monthExpense.expense.type !== EXPENSE_TYPES.COMISSAO &&
                      !this.userService.isEqual(monthExpense.expense.source, CLIENT)
                    ) {
                      data[team][monthExpense.month].expenses = sumMoney(
                        data[team][monthExpense.month].expenses,
                        monthExpense.expense.value
                      );
                    }
                  });
                });
                // Sum payments in related months
                const paymentsByMonth = Object.values(
                  groupBy(
                    monthContract.contract.payments
                      .filter((payment) => payment.paid && payment.paidDate && getYear(payment.paidDate) == year)
                      .map((payment) => ({ payment: payment, month: getMonth(payment.paidDate as Date) })),
                    '1'
                  )
                ) as { payment: ContractPayment; month: number }[][];
                paymentsByMonth.forEach((monthPayments) => {
                  monthPayments.forEach((monthPayment) => {
                    data[team][monthPayment.month].op = sumMoney(
                      data[team][monthPayment.month].op,
                      monthPayment.payment.value
                    );
                  });
                });
                // Sum receipts in related months
                if (
                  this.invoiceService
                    .idToInvoice(monthContract.contract.invoice as Invoice | string)
                    .type.toLowerCase() != EXCLUDED_TYPOLOGIES.BALANCE
                ) {
                  const receiptsByMonth = Object.values(
                    groupBy(
                      monthContract.contract.receipts.map((receipt) => ({
                        receipt: receipt,
                        month: getMonth(receipt.paidDate as Date),
                      })),
                      '1'
                    )
                  ) as { receipt: ContractReceipt; month: number }[][];
                  receiptsByMonth.forEach((monthReceipts) => {
                    monthReceipts.forEach((monthReceipt) => {
                      if (
                        monthReceipt.receipt.paid &&
                        monthReceipt.receipt.paidDate &&
                        getYear(monthReceipt.receipt.paidDate) == year
                      ) {
                        data[team][monthReceipt.month].oe_gross = sumMoney(
                          data[team][monthReceipt.month].oe_gross,
                          monthReceipt.receipt.value
                        );
                        data[team][monthReceipt.month].oe_net = sumMoney(
                          data[team][monthReceipt.month].oe_net,
                          this.contractService.receiptNetValue(monthReceipt.receipt)
                        );
                        data[team][monthReceipt.month].oe_organization = sumMoney(
                          data[team][monthReceipt.month].oe_organization,
                          applyPercentage(monthReceipt.receipt.value, monthReceipt.receipt.nortanPercentage)
                        );
                        data[team][monthReceipt.month].oe_nf = sumMoney(
                          data[team][monthReceipt.month].oe_nf,
                          applyPercentage(monthReceipt.receipt.value, monthReceipt.receipt.notaFiscal)
                        );
                        if (
                          monthContract.contract.invoice &&
                          this.invoiceService.idToInvoice(monthContract.contract.invoice).administration == 'nortan'
                        ) {
                          data[team][monthReceipt.month].support_organization = sumMoney(
                            data[team][monthReceipt.month].support_organization,
                            monthReceipt.receipt.value
                          );
                        } else {
                          data[team][monthReceipt.month].support_personal = sumMoney(
                            data[team][monthReceipt.month].support_personal,
                            monthReceipt.receipt.value
                          );
                        }
                      } else {
                        const start = monthReceipt.receipt.created;
                        const end = monthReceipt.receipt.paidDate || new Date();
                        const intersection = getIntersectionBetweenDates(start, end, year);
                        if (intersection) {
                          for (
                            let month = intersection.start.getMonth();
                            month < intersection.end.getMonth();
                            month++
                          ) {
                            data[team][month].ongoing_oe += 1;
                            data[team][month].ongoing_oe_value = sumMoney(
                              data[team][month].ongoing_oe_value,
                              monthReceipt.receipt.value
                            );
                          }
                        }
                      }
                    });
                  });
                }
                // To receive value
                // if (monthContract.contract.invoice) {
                //   const invoice = this.invoiceService.idToInvoice(monthContract.contract.invoice);
                //   invoice.team.forEach((member) => {
                //     if (this.teamService.isSectorEqual(member.team, team)) {
                //       const toReceive = sumMoney(
                //         this.contractService.notPaidValue(member.distribution, member.user, monthContract.contract),
                //         numberToMoney(
                //           this.contractService.expensesContributions(monthContract.contract, member.user).user.cashback
                //         )
                //       );
                //       data[team].overview.to_receive = sumMoney(
                //         data[team].overview.to_receive,
                //         toReceive
                //       );
                //     }
                //   });
                // }
              }
            }
          });
        });
        for (const team of Object.keys(data)) {
          for (let i = 0; i < data[team].length; i++) {
            data[team][i].expenses_total = sumMoney(data[team][i].op, data[team][i].expenses);
            data[team][i].net_balance = subtractMoney(data[team][i].oe_net, data[team][i].expenses_total);
          }
        }
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
        Recebido: numberToMoney(
          await firstValueFrom(
            this.metricsService.nortanValue(start, end, 'oe').pipe(map((metricInfo) => metricInfo.global))
          )
        ),
        Repassado: numberToMoney(
          await firstValueFrom(
            this.metricsService.receivedValueNortan(start, end).pipe(map((metricInfo) => metricInfo.global))
          )
        ),
        'Taxa Nortan': numberToMoney(
          await firstValueFrom(this.metricsService.nortanValue(start, end).pipe(map((metricInfo) => metricInfo.global)))
        ),
        Impostos: numberToMoney(
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
      switch (this.selectedGroupingType) {
        case GROUPING_TYPES.CONTRACT: {
          from(this.contractsYearReview(this.selectedYear)).subscribe((csv: string) => {
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, `Relatorio Taxas ${this.selectedYear}.csv`);
            this.isGenerating = false;
          });
          break;
        }
        case GROUPING_TYPES.TEAMS: {
          this.computeReportDataByTeam(this.selectedYear)
            .pipe(take(1))
            .subscribe((data: Record<string, TeamData[]>) => {
              const csv = generateTeamsReport(data, this.teamService.idToTeam.bind(this.teamService));

              const blob = new Blob([csv], { type: 'text/csv' });
              saveAs(blob, `Relatorio de Metricas ${this.selectedYear}.csv`);
              this.isGenerating = false;
            });
          break;
        }
        default: {
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
      }
    }, 200);
  }

  shouldDisableDownloadButton(): boolean {
    return (
      !this.selectedGroupingType || !this.selectedReportType || this.selectedYear == undefined || this.isGenerating
    );
  }
}
