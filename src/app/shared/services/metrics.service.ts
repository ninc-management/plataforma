import { Injectable, OnDestroy } from '@angular/core';
import { format } from 'date-fns';
import { add, cloneDeep, mergeWith } from 'lodash';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, skipWhile, take, takeUntil } from 'rxjs/operators';

import {
  groupByDateTimeSerie,
  idToProperty,
  isValidDate,
  isWithinInterval,
  nfPercentage,
  nortanPercentage,
  valueSort,
} from '../utils';
import { CONTRACT_STATOOS, ContractService } from './contract.service';
import { ContractorService } from './contractor.service';
import { INVOICE_STATOOS, InvoiceService } from './invoice.service';
import { StringUtilService } from './string-util.service';
import { TeamService } from './team.service';
import { CLIENT, CONTRACT_BALANCE, UserService } from './user.service';

import { Contract } from '@models/contract';
import { InvoiceTeamMember } from '@models/invoice';

export type TimeSeriesItem = [string, number];

/* eslint-disable indent */
// prettier-ignore
export interface TimeSeries {
  name: string;
  type: 'line' | 'bar' | 'boxplot' | 'candlestick' | 'parallel';
  smooth: boolean;
  cumulative: boolean;
  symbol:
    | 'circle'
    | 'rect'
    | 'roundRect'
    | 'triangle'
    | 'diamond'
    | 'pin'
    | 'arrow'
    | 'none';
  barGap?: string;
  barMaxWidth?: number | string;
  isMoney?: boolean;
  data: TimeSeriesItem[];
}
/* eslint-enable indent */

export interface MetricInfo {
  count: number;
  value: number;
}

interface TeamInfo {
  id: string;
  value: number;
}

interface SectorInfo {
  id: string;
  value: number;
  teamIdx: number;
}

interface UserAndGlobalMetric {
  user: number;
  global: number;
}

interface UserAndSectors {
  user: SectorInfo[];
  global: SectorInfo[];
}

interface UserAndTeams {
  user: TeamInfo[];
  global: TeamInfo[];
}

export interface ReceivableByContract {
  contract: Contract;
  receivableValue: string;
}

interface UserReceivable {
  totalValue: string;
  receivableContracts: ReceivableByContract[];
}

interface ValueByContractor {
  contractorName: string;
  data: ContractorInfo;
}

interface ContractorInfo {
  value: string;
  percentage: string;
}

interface InvoicesAsMemberParams {
  uId: string;
  last?: 'Hoje' | 'Dia' | 'Mês' | 'Ano';
  number?: number;
  fromToday?: boolean;
  allowedStatuses?: INVOICE_STATOOS[];
  onlyNew?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  destroy$ = new Subject<void>();

  private defaultUserAndSectors: UserAndSectors = {
    user: [],
    global: [],
  };

  private defaultUserAndTeams: UserAndTeams = {
    user: [],
    global: [],
  };

  constructor(
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private userService: UserService,
    private stringUtil: StringUtilService,
    private teamService: TeamService,
    private contractorService: ContractorService
  ) {
    this.teamService
      .getTeams()
      .pipe(
        skipWhile((teams) => teams.length == 0),
        take(1)
      )
      .subscribe((teams) => {
        const baseTeams = teams.map((team): TeamInfo => ({ id: team._id, value: 0 }));
        const baseSectors = teams
          .map((team, idx) => team.sectors.map((sector): SectorInfo => ({ id: sector._id, value: 0, teamIdx: idx })))
          .flat();

        this.defaultUserAndTeams = { user: cloneDeep(baseTeams), global: cloneDeep(baseTeams) };
        this.defaultUserAndSectors = { user: cloneDeep(baseSectors), global: cloneDeep(baseSectors) };
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  mergeSectorInfo(o1: SectorInfo, o2: SectorInfo): SectorInfo {
    if (!o1) return o2;
    if (!o2) return o1;
    o1.value += o2.value;
    return o1;
  }

  plural(last: string, number: number): string {
    switch (last) {
      case 'Dia': {
        return number > 1 ? 'Nos últimos ' + number + ' dias' : 'Ontem';
      }
      case 'Mês': {
        return number > 1 ? 'Nos últimos ' + number + ' meses' : 'No mês passado';
      }
      case 'Ano': {
        return number > 1 ? 'Nos últimos ' + number + ' anos' : 'No ano passado';
      }
      default: {
        return '';
      }
    }
  }

  contractsAsManager(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, , ,]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
              isValidDate(created, last, number, fromToday)
            ) {
              const invoice = this.invoiceService.idToInvoice(contract.invoice);
              metricInfo.count += 1;
              metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesAsManager(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest([this.invoiceService.getInvoices(), this.invoiceService.isDataLoaded$]).pipe(
      skipWhile(([, isInvoiceDataLoaded]) => !isInvoiceDataLoaded),
      map(([invoices, _]) => {
        return invoices
          .filter((invoices) => invoices.status != INVOICE_STATOOS.INVALIDADO)
          .reduce(
            (metricInfo: MetricInfo, invoice) => {
              const created = invoice.created;
              if (this.invoiceService.isInvoiceAuthor(invoice, uId) && isValidDate(created, last, number, fromToday)) {
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
              }
              return metricInfo;
            },
            { count: 0, value: 0 }
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  contractsAsMember(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, _]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceMember(contract.invoice, uId) &&
              isValidDate(created, last, number, fromToday)
            ) {
              const invoice = this.invoiceService.idToInvoice(contract.invoice);
              metricInfo.count += 1;
              metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesAsMember({
    uId,
    last = 'Hoje',
    number = 1,
    fromToday = false,
    allowedStatuses = [INVOICE_STATOOS.EM_ANALISE, INVOICE_STATOOS.FECHADO, INVOICE_STATOOS.NEGADO],
    onlyNew = true,
  }: InvoicesAsMemberParams): Observable<MetricInfo> {
    return combineLatest([this.invoiceService.getInvoices(), this.invoiceService.isDataLoaded$]).pipe(
      skipWhile(([, isInvoiceDataLoaded]) => !isInvoiceDataLoaded),
      map(([invoices, _]) => {
        return invoices
          .filter((invoices) => allowedStatuses.includes(invoices.status as INVOICE_STATOOS))
          .reduce(
            (metricInfo: MetricInfo, invoice) => {
              if (this.invoiceService.isInvoiceMember(invoice, uId)) {
                const created = invoice.created;
                if (onlyNew && isValidDate(created, last, number, fromToday)) {
                  metricInfo.count += 1;
                  metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
                } else {
                  metricInfo.count += 1;
                  metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
                }
              }

              return metricInfo;
            },
            { count: 0, value: 0 }
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  receivedValueBySectors(start: Date, end: Date, uId?: string): Observable<UserAndSectors> {
    return combineLatest([this.contractService.getContracts(), this.contractService.isDataLoaded$]).pipe(
      skipWhile(([, isContractDataLoaded]) => !isContractDataLoaded),
      map(([contracts, _]) => {
        return contracts.reduce((received: UserAndSectors, contract) => {
          if (this.contractService.hasPayments(contract._id)) {
            const value = contract.payments.reduce((paid: UserAndSectors, payment) => {
              if (payment.paid) {
                const paidDate = payment.paidDate;
                if (paidDate && isWithinInterval(paidDate, start, end)) {
                  const uCPayments = payment.team.reduce((upaid: UserAndSectors, member) => {
                    const globalIdx = upaid.global.findIndex(
                      (o) => o.id == this.teamService.idToSector(member.sector)._id
                    );
                    if (globalIdx != -1) {
                      upaid.global[globalIdx].value += this.stringUtil.moneyToNumber(member.value);
                      if (this.userService.isEqual(member.user, uId)) {
                        upaid.user[globalIdx].value += this.stringUtil.moneyToNumber(member.value);
                      }
                    }

                    return upaid;
                  }, cloneDeep(this.defaultUserAndSectors));
                  paid.user = mergeWith([], paid.user, uCPayments.user, this.mergeSectorInfo);
                  paid.global = mergeWith([], paid.global, uCPayments.global, this.mergeSectorInfo);
                }
              }
              return paid;
            }, cloneDeep(this.defaultUserAndSectors));

            received.user = mergeWith([], received.user, value.user, this.mergeSectorInfo);
            received.global = mergeWith([], received.global, value.global, this.mergeSectorInfo);
          }
          if (this.contractService.hasExpenses(contract._id)) {
            for (const expense of contract.expenses) {
              if (expense.paid && expense.source) {
                const paidDate = expense.paidDate;
                const source = this.userService.idToUser(expense.source);
                if (
                  paidDate &&
                  isWithinInterval(paidDate, start, end) &&
                  source._id != CONTRACT_BALANCE._id &&
                  source._id != CLIENT._id &&
                  source.position.some((p) => new RegExp('/Direto(r|ra) de T.I/').test(p))
                ) {
                  for (const member of expense.team) {
                    const globalIdx = received.global.findIndex(
                      (o) => o.id == this.teamService.idToSector(member.sector)._id
                    );
                    if (globalIdx != -1) {
                      received.global[globalIdx].value -= this.stringUtil.moneyToNumber(member.value);
                      if (this.userService.isEqual(member.user, uId)) {
                        received.user[globalIdx].value -= this.stringUtil.moneyToNumber(member.value);
                      }
                    }
                  }
                }
              }
            }
          }
          return received;
        }, cloneDeep(this.defaultUserAndSectors));
      }),
      takeUntil(this.destroy$)
    );
  }

  receivedValueByTeams(start: Date, end: Date, uId?: string): Observable<UserAndTeams> {
    return this.receivedValueBySectors(start, end, uId).pipe(
      map((userSector: UserAndSectors) => {
        const userTeams = cloneDeep(this.defaultUserAndTeams);
        for (const i in userSector.user) {
          userTeams.user[userSector.user[i].teamIdx].value += userSector.user[i].value;
          userTeams.global[userSector.global[i].teamIdx].value += userSector.global[i].value;
        }
        return userSector;
      })
    );
  }

  receivedValueNortan(start: Date, end: Date, uId?: string): Observable<UserAndGlobalMetric> {
    return this.receivedValueByTeams(start, end, uId).pipe(
      map((userTeams: UserAndTeams) => {
        const result: UserAndGlobalMetric = { user: 0, global: 0 };
        result.user = Object.values(userTeams.user).reduce((acc, tInfo) => acc + tInfo.value, 0);
        result.global = Object.values(userTeams.global).reduce((acc, tInfo) => acc + tInfo.value, 0);
        return result;
      })
    );
  }

  receivedValueList(last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje', number = 1, fromToday = false): Observable<any> {
    return combineLatest([
      this.contractService.getContracts(),
      this.userService.getUsers(),
      this.contractService.isDataLoaded$,
      this.userService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isUserDataLoaded]) => !(isContractDataLoaded && isUserDataLoaded)),
      map(([contracts, users, ,]) => {
        const partial = contracts.reduce((received: any, contract) => {
          if (this.contractService.hasPayments(contract._id)) {
            const value = contract.payments.reduce((paid: any, payment) => {
              if (payment.paid) {
                const paidDate = payment.paidDate;
                if (paidDate && isValidDate(paidDate, last, number, fromToday)) {
                  const uCPayments = payment.team.reduce((upaid: any, member) => {
                    if (member.user) {
                      const author = idToProperty(
                        member.user,
                        this.userService.idToUser.bind(this.userService),
                        'fullName'
                      );

                      const value = this.stringUtil.moneyToNumber(member.value);
                      upaid[author] = upaid[author] ? upaid[author] + value : value;
                    }
                    return upaid;
                  }, {});
                  paid = mergeWith({}, paid, uCPayments, add);
                }
              }
              return paid;
            }, {});
            received = mergeWith({}, received, value, add);
          }
          return received;
        }, {});
        const complete = users.reduce((userList: any, user) => {
          userList[user.fullName] = 0;
          return userList;
        }, {});
        return mergeWith({}, partial, complete, add);
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContracts(
    role: 'manager' | 'member',
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<number> {
    /* eslint-disable indent */
    const combined$ =
      role == 'manager'
        ? combineLatest([
            this.contractsAsManager(uId, last, number, fromToday),
            this.invoicesAsManager(uId, last, number, fromToday),
          ])
        : combineLatest([
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember({ uId: uId, last: last, number: number, fromToday: fromToday }),
          ]);
    /* eslint-enable indent */
    return combined$.pipe(
      map(([contracts, invoices]) => {
        return this.stringUtil.moneyToNumber(
          this.stringUtil.toPercentageNumber(contracts.count, invoices.count).slice(0, -1)
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContractsValue(
    role: 'manager' | 'member',
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<number> {
    /* eslint-disable indent */
    const combined$ =
      role == 'manager'
        ? combineLatest([
            this.contractsAsManager(uId, last, number, fromToday),
            this.invoicesAsManager(uId, last, number, fromToday),
          ])
        : combineLatest([
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember({ uId: uId, last: last, number: number, fromToday: fromToday }),
          ]);
    /* eslint-enable indent */
    return combined$.pipe(
      map(([contracts, invoices]) => {
        return this.stringUtil.moneyToNumber(
          this.stringUtil.toPercentageNumber(contracts.value, invoices.value).slice(0, -1)
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  impulses(
    uId?: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<number> {
    return combineLatest([this.contractService.getContracts(), this.contractService.isDataLoaded$]).pipe(
      skipWhile(([, isContractDataLoaded]) => !isContractDataLoaded),
      map(([contracts, _]) => {
        return contracts.reduce((sum, contract) => {
          if (this.contractService.hasReceipts(contract._id)) {
            sum += contract.receipts
              .filter((r) => r.paid)
              .reduce((acc, receipt) => {
                const paidDate = receipt.paidDate;
                if (paidDate && isValidDate(paidDate, last, number, fromToday))
                  acc += this.stringUtil.moneyToNumber(
                    this.contractService.toNetValue(
                      receipt.value,
                      nfPercentage(contract),
                      nortanPercentage(contract),
                      contract.created
                    )
                  );
                return acc;
              }, 0.0);
          }
          return sum;
        }, 0.0);
      }),
      map((sumNetValue) => Math.trunc(sumNetValue / 1000))
    );
  }

  contracts(uId: string, start: Date, end: Date): Observable<MetricInfo> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, , ,]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
              isWithinInterval(created, start, end)
            ) {
              const invoice = this.invoiceService.idToInvoice(contract.invoice);
              metricInfo.count += 1;
              metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      take(1)
    );
  }

  userReceivedValue(userID: string, start: Date, end: Date): Observable<MetricInfo> {
    return combineLatest([this.contractService.getContracts(), this.contractService.isDataLoaded$]).pipe(
      skipWhile(([, isContractDataLoaded]) => !isContractDataLoaded),
      takeUntil(this.destroy$),
      map(([contracts, _]) => {
        const receivedMetricInfo = { count: 0, value: 0 };

        return contracts.reduce((receivedMetricInfo, contract) => {
          if (this.contractService.contractHasPaymentsWithUser(contract, userID)) {
            receivedMetricInfo.value = this.stringUtil.moneyToNumber(
              this.stringUtil.sumMoney(
                this.stringUtil.numberToMoney(receivedMetricInfo.value),
                this.contractService.receivedValue(userID, contract, start, end)
              )
            );

            receivedMetricInfo.count += 1;
          }

          return receivedMetricInfo;
        }, receivedMetricInfo);
      })
    );
  }

  nortanValue(
    start: Date,
    end: Date,
    type: 'nortan' | 'taxes' = 'nortan',
    uId?: string
  ): Observable<UserAndGlobalMetric> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, , ,]) => {
        return contracts.reduce(
          (metricInfo: UserAndGlobalMetric, contract) => {
            if (this.contractService.hasReceipts(contract._id)) {
              const value = contract.receipts
                .filter((receipt) => receipt.paid)
                .reduce(
                  (paid: UserAndGlobalMetric, receipt) => {
                    const paidDate = receipt.paidDate;
                    if (paidDate && isWithinInterval(paidDate, start, end)) {
                      const value = this.stringUtil.moneyToNumber(
                        this.stringUtil.applyPercentage(
                          receipt.value,
                          type == 'nortan' ? receipt.nortanPercentage : receipt.notaFiscal
                        )
                      );
                      if (uId && contract.invoice && this.invoiceService.isInvoiceAuthor(contract.invoice, uId))
                        paid.user += value;
                      paid.global += value;
                    }
                    return paid;
                  },
                  { user: 0, global: 0 }
                );
              metricInfo.user += value.user;
              metricInfo.global += value.global;
            }
            return metricInfo;
          },
          { user: 0, global: 0 }
        );
      }),
      take(1)
    );
  }

  teamExpenses(tId: string, start: Date, end: Date): Observable<MetricInfo> {
    return combineLatest([this.teamService.getTeams(), this.teamService.isDataLoaded$]).pipe(
      skipWhile(([, isTeamsDataLoaded]) => !isTeamsDataLoaded),
      map(() => {
        return this.teamService
          .idToTeam(tId)
          .expenses.filter((expense) => expense.paid)
          .reduce(
            (acc, expense) => {
              const paidDate = expense.paidDate;
              if (paidDate && isWithinInterval(paidDate, start, end)) {
                acc.count += 1;
                acc.value += this.stringUtil.moneyToNumber(expense.value);
              }
              return acc;
            },
            { count: 0, value: 0 }
          );
      })
    );
  }

  cashbackValue(uId: string, percentage: string, start: Date, end: Date): Observable<MetricInfo> {
    return this.nortanValue(start, end, 'nortan', uId).pipe(
      map((metricInfo): MetricInfo => {
        metricInfo.user *= this.stringUtil.toMultiplyPercentage(percentage);
        return { count: 0, value: metricInfo.user };
      })
    );
  }

  countContracts(status: CONTRACT_STATOOS): Observable<MetricInfo> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, , ,]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            if (contract.status == status) {
              metricInfo.count += 1;
              if (contract.invoice)
                metricInfo.value += this.stringUtil.moneyToNumber(
                  this.invoiceService.idToInvoice(contract.invoice).value
                );
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      take(1)
    );
  }

  receivedValueTimeSeries(uId?: string): Observable<TimeSeriesItem[]> {
    return combineLatest([this.contractService.getContracts(), this.contractService.isDataLoaded$]).pipe(
      skipWhile(([, isContractDataLoaded]) => !isContractDataLoaded),
      map(([contracts, _]) => {
        const fContracts = contracts.filter((contract) => this.contractService.hasPayments(contract));
        const timeSeriesItems = fContracts.map((contract) => {
          let fPayments = contract.payments.filter((payment) => payment.paid);
          if (uId != undefined) {
            fPayments = fPayments.filter((payment) => {
              return payment.team
                .map((team) => this.userService.isEqual(team.user, uId))
                .filter((isSameUser) => isSameUser).length;
            });
            fPayments = fPayments.map((payment) => {
              const tmp = cloneDeep(payment);
              tmp.value = payment.team[0].value;
              return tmp;
            });
          }
          return fPayments.map((payment) => {
            const date: string = payment.paidDate ? format(payment.paidDate, 'yyyy/MM/dd') : '';
            return [date, this.stringUtil.moneyToNumber(payment.value)] as TimeSeriesItem;
          });
        });
        const timeSeriesItemsFlat = timeSeriesItems.flat();
        return groupByDateTimeSerie(timeSeriesItemsFlat);
      })
    );
  }

  expensesTimeSeries(uId?: string): Observable<TimeSeriesItem[]> {
    return combineLatest([this.contractService.getContracts(), this.contractService.isDataLoaded$]).pipe(
      skipWhile(([, isContractDataLoaded]) => !isContractDataLoaded),
      map(([contracts, _]) => {
        const fContracts = cloneDeep(contracts.filter((contract) => this.contractService.hasExpenses(contract)));
        const timeSeriesItems = fContracts.map((contract) => {
          let fExpenses = contract.expenses.filter(
            (expense) =>
              expense.paid &&
              !this.userService.isEqual(expense.source, CONTRACT_BALANCE) &&
              !this.userService.isEqual(expense.source, CLIENT)
          );
          if (uId != undefined) {
            fExpenses = fExpenses.filter((expense) => {
              return expense.team
                .map((team) => this.userService.isEqual(team.user, uId))
                .filter((isSameUser) => isSameUser).length;
            });
            fExpenses = fExpenses.map((expense) => {
              expense.value = expense.team[0].value;
              return expense;
            });
          }
          return fExpenses.map((expense) => {
            const date: string = expense.paidDate ? format(expense.paidDate, 'yyyy/MM/dd') : '';
            return [date, -1 * this.stringUtil.moneyToNumber(expense.value)] as TimeSeriesItem;
          });
        });
        const timeSeriesItemsFlat = timeSeriesItems.flat();
        return groupByDateTimeSerie(timeSeriesItemsFlat);
      })
    );
  }

  contractValueTimeSeries(uId?: string): Observable<TimeSeriesItem[]> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      map(([contracts, , ,]) => {
        let fContracts = contracts.map((iContract) => {
          const contract = cloneDeep(iContract);
          if (contract.invoice) contract.value = this.invoiceService.idToInvoice(contract.invoice).value;
          return contract;
        });
        if (uId != undefined) {
          fContracts = fContracts.filter((contract) => {
            if (contract.invoice === undefined) return false;
            return this.invoiceService
              .idToInvoice(contract.invoice)
              .team.map((team) => this.userService.isEqual(team.user, uId) && team.distribution != undefined)
              .filter((isSameUser) => isSameUser).length;
          });
          fContracts = fContracts.map((contract) => {
            if (contract.invoice !== undefined) {
              contract.value = this.stringUtil.applyPercentage(
                contract.value,
                this.invoiceService.idToInvoice(contract.invoice).team[0].distribution
              );
            }
            return contract;
          });
        }
        const timeSeriesItems = fContracts.map((contract) => {
          const date: string = contract.created ? format(contract.created, 'yyyy/MM/dd') : '';
          return [date, this.stringUtil.moneyToNumber(contract.value)] as TimeSeriesItem;
        });
        return groupByDateTimeSerie(timeSeriesItems);
      })
    );
  }

  userReceivableValue(uId: string): Observable<UserReceivable> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
    ]).pipe(
      skipWhile(
        ([, , , isContractDataLoaded, isInvoiceDataLoaded, isContractorDataLoaded]) =>
          !(isContractDataLoaded && isInvoiceDataLoaded && isContractorDataLoaded)
      ),
      map(([contracts, , , , ,]) => {
        return contracts.reduce(
          (userReceivable: UserReceivable, contract) => {
            if (
              contract.invoice &&
              contract.status != CONTRACT_STATOOS.ARQUIVADO &&
              contract.status != CONTRACT_STATOOS.CONCLUIDO
            ) {
              const invoice = this.invoiceService.idToInvoice(contract.invoice);
              const member = invoice.team.find((member) => this.userService.isEqual(member.user, uId));

              if (member) {
                contract = this.contractService.fillContract(contract);
                const currentReceivableValue = this.receivableValue(contract, member);

                userReceivable.receivableContracts.push({
                  contract: contract,
                  receivableValue: currentReceivableValue,
                });

                userReceivable.totalValue = this.stringUtil.sumMoney(currentReceivableValue, userReceivable.totalValue);
              }
            }

            return userReceivable;
          },
          { totalValue: '', receivableContracts: [] }
        );
      })
    );
  }

  accumulatedValueByContractor(topK = 10): Observable<ValueByContractor[]> {
    return combineLatest([
      this.contractService.getContracts(),
      this.contractorService.getContractors(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(
        ([, , , isContractDataLoaded, isContractorDataLoaded, isInvoiceDataLoaded]) =>
          !(isContractDataLoaded && isContractorDataLoaded && isInvoiceDataLoaded)
      ),
      map(([contracts, , , , ,]) => {
        const valueByContractor = this.contractValueSumByContractor(contracts);
        return this.sortContractorsByValue(valueByContractor).slice(0, topK);
      })
    );
  }

  parettoRank(): Observable<ValueByContractor[]> {
    let accumulatedPercentage = 0;
    let hasAchievedLimit = false;
    return this.accumulatedValueByContractor().pipe(
      takeUntil(this.destroy$),
      map((valueByContractor) => {
        //This array is ordered by descending order
        return valueByContractor.filter((contractorInfo) => {
          const contractorPercentage = this.stringUtil.moneyToNumber(contractorInfo.data.percentage.slice(0, -1));
          if (!hasAchievedLimit && accumulatedPercentage + contractorPercentage <= 80) {
            accumulatedPercentage += contractorPercentage;
            return true;
          }
          hasAchievedLimit = true;
          return false;
        });
      })
    );
  }

  userBalanceSumInContracts(userID: string): Observable<string> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      takeUntil(this.destroy$),
      map(([contracts, , ,]) => {
        const filteredContracts = contracts.filter(
          (contract) =>
            this.contractService.isContractActive(contract) &&
            contract.invoice &&
            this.invoiceService.isInvoiceMember(contract.invoice, userID)
        );

        return filteredContracts.reduce((balanceSum, contract) => {
          return this.stringUtil.sumMoney(balanceSum, this.contractService.getMemberBalance(userID, contract));
        }, '0,00');
      })
    );
  }

  userExpenses(userID: string, start: Date, end: Date): Observable<MetricInfo> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ]).pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      takeUntil(this.destroy$),
      map(([contracts, , ,]) => {
        const validContracts = contracts.filter((contract) =>
          this.contractService.contractHasExpensesWithUser(contract, userID)
        );

        const expensesSum = validContracts.reduce((expensesSum, contract) => {
          return this.stringUtil.sumMoney(
            expensesSum,
            this.contractService.getMemberExpensesSum(userID, contract, start, end)
          );
        }, '0,00');

        return {
          value: this.stringUtil.moneyToNumber(expensesSum),
          count: validContracts.length,
        } as MetricInfo;
      })
    );
  }

  private sortContractorsByValue(valueByContractor: Record<string, ContractorInfo>): ValueByContractor[] {
    return Object.entries(valueByContractor)
      .sort((contractorA, contractorB) => valueSort(-1, contractorA[1].value, contractorB[1].value))
      .map((contractor) => {
        return {
          contractorName: contractor[0],
          data: { value: contractor[1].value, percentage: contractor[1].percentage },
        };
      });
  }

  private calculatePercentagesByContractor(
    valueByContractor: Record<string, ContractorInfo>,
    totalValue: string
  ): void {
    Object.keys(valueByContractor).forEach((contractorName) => {
      valueByContractor[contractorName].percentage = this.stringUtil.toPercentage(
        valueByContractor[contractorName].value,
        totalValue
      );
    });
  }

  private contractValueSumByContractor(contracts: Contract[]): Record<string, ContractorInfo> {
    let totalValue = '0,00';
    const valueByContractor = contracts.reduce((valueByContractor: Record<string, ContractorInfo>, contract) => {
      if (contract.invoice) {
        const invoice = this.invoiceService.idToInvoice(contract.invoice);
        if (invoice.contractor) {
          const contractorName = this.contractorService.idToContractor(invoice.contractor).fullName;

          if (!valueByContractor[contractorName]) {
            valueByContractor[contractorName] = { value: '0,00', percentage: '0,00%' };
          }

          valueByContractor[contractorName].value = this.stringUtil.sumMoney(
            valueByContractor[contractorName].value,
            invoice.value
          );

          totalValue = this.stringUtil.sumMoney(totalValue, invoice.value);
        }
      }
      return valueByContractor;
    }, {});

    this.calculatePercentagesByContractor(valueByContractor, totalValue);
    return valueByContractor;
  }

  private receivableValue(contract: Contract, member: InvoiceTeamMember): string {
    const notPaid = this.contractService.notPaidValue(member.distribution, member.user, contract);
    const cashback = this.stringUtil.numberToMoney(
      this.contractService.expensesContributions(contract, member.user).user.cashback
    );

    return this.stringUtil.sumMoney(notPaid, cashback);
  }
}
