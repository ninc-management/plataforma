import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map, take, filter, skipWhile } from 'rxjs/operators';
import { ContractService, CONTRACT_STATOOS } from './contract.service';
import { InvoiceService, INVOICE_STATOOS } from './invoice.service';
import { UserService, CONTRACT_BALANCE, CLIENT } from './user.service';
import { StringUtilService } from './string-util.service';
import { UtilsService } from './utils.service';
import { cloneDeep, mergeWith, add } from 'lodash';
import { format } from 'date-fns';
import { TeamService } from './team.service';
import { Contract } from '@models/contract';
import { ContractorService } from './contractor.service';
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

interface MetricInfo {
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
    private utils: UtilsService,
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
          .map((team, idx) =>
            team.config.sectors.map((sector): SectorInfo => ({ id: sector._id, value: 0, teamIdx: idx }))
          )
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

  contractsAsManger(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
              this.utils.isValidDate(created, last, number, fromToday)
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

  invoicesAsManger(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return this.invoiceService.getInvoices().pipe(
      filter((invoices) => invoices.length > 0),
      map((invoices) => {
        return invoices
          .filter((invoices) => invoices.status != INVOICE_STATOOS.INVALIDADO)
          .reduce(
            (metricInfo: MetricInfo, invoice) => {
              const created = invoice.created;
              if (
                this.invoiceService.isInvoiceAuthor(invoice, uId) &&
                this.utils.isValidDate(created, last, number, fromToday)
              ) {
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
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceMember(contract.invoice, uId) &&
              this.utils.isValidDate(created, last, number, fromToday)
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

  invoicesAsMember(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return this.invoiceService.getInvoices().pipe(
      filter((invoices) => invoices.length > 0),
      map((invoices) => {
        return invoices
          .filter((invoices) => invoices.status != INVOICE_STATOOS.INVALIDADO)
          .reduce(
            (metricInfo: MetricInfo, invoice) => {
              const created = invoice.created;
              if (
                this.invoiceService.isInvoiceMember(invoice, uId) &&
                this.utils.isValidDate(created, last, number, fromToday)
              ) {
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

  receivedValueBySectors(start: Date, end: Date, uId?: string): Observable<UserAndSectors> {
    return this.contractService.getContracts().pipe(
      filter((contracts) => contracts.length > 0),
      map((contracts) => {
        return contracts.reduce((received: UserAndSectors, contract) => {
          if (this.contractService.hasPayments(contract._id)) {
            const value = contract.payments.reduce((paid: UserAndSectors, payment) => {
              if (payment.paid) {
                const paidDate = payment.paidDate;
                if (paidDate && this.utils.isWithinInterval(paidDate, start, end)) {
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
                  this.utils.isWithinInterval(paidDate, start, end) &&
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
        for (let i in userSector.user) {
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
    return combineLatest([this.contractService.getContracts(), this.userService.getUsers()]).pipe(
      map(([contracts, users]) => {
        if (contracts.length > 0 && users.length > 0) {
          const partial = contracts.reduce((received: any, contract) => {
            if (this.contractService.hasPayments(contract._id)) {
              const value = contract.payments.reduce((paid: any, payment) => {
                if (payment.paid) {
                  const paidDate = payment.paidDate;
                  if (paidDate && this.utils.isValidDate(paidDate, last, number, fromToday)) {
                    const uCPayments = payment.team.reduce((upaid: any, member) => {
                      if (member.user) {
                        const author = this.userService.idToName(member.user);
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
        }
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
            this.contractsAsManger(uId, last, number, fromToday),
            this.invoicesAsManger(uId, last, number, fromToday),
          ])
        : combineLatest([
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember(uId, last, number, fromToday),
          ]);
    /* eslint-enable indent */
    return combined$.pipe(
      filter(([contracts, invoices]) => contracts != undefined && invoices != undefined),
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
            this.contractsAsManger(uId, last, number, fromToday),
            this.invoicesAsManger(uId, last, number, fromToday),
          ])
        : combineLatest([
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember(uId, last, number, fromToday),
          ]);
    /* eslint-enable indent */
    return combined$.pipe(
      filter(([contracts, invoices]) => contracts != undefined && invoices != undefined),
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
    return this.contractService.getContracts().pipe(
      map((contracts) => {
        if (contracts.length > 0) {
          return contracts.reduce((sum, contract) => {
            if (this.contractService.hasReceipts(contract._id)) {
              sum += contract.receipts
                .filter((r) => r.paid)
                .reduce((acc, receipt) => {
                  const paidDate = receipt.paidDate;
                  if (paidDate && this.utils.isValidDate(paidDate, last, number, fromToday))
                    acc += this.stringUtil.moneyToNumber(
                      this.contractService.toNetValue(
                        receipt.value,
                        this.utils.nfPercentage(contract),
                        this.utils.nortanPercentage(contract),
                        contract.created
                      )
                    );
                  return acc;
                }, 0.0);
            }
            return sum;
          }, 0.0);
        }
        return 0.0;
      }),
      map((sumNetValue) => Math.trunc(sumNetValue / 1000))
    );
  }

  contracts(uId: string, start: Date, end: Date): Observable<MetricInfo> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
              this.utils.isWithinInterval(created, start, end)
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

  receivedValue(uId: string, start: Date, end: Date): Observable<MetricInfo> {
    return this.contractService.getContracts().pipe(
      filter((contracts) => contracts.length > 0),
      map((contracts) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            if (this.contractService.hasPayments(contract._id)) {
              const value = contract.payments.reduce(
                (paid: MetricInfo, payment) => {
                  if (payment.paid && payment.paidDate) {
                    const paidDate = payment.paidDate;
                    if (this.utils.isWithinInterval(paidDate, start, end)) {
                      const uPayments = payment.team.reduce(
                        (upaid: MetricInfo, member) => {
                          if (this.userService.isEqual(member.user, uId)) {
                            upaid.count += 1;
                            upaid.value += this.stringUtil.moneyToNumber(member.value);
                          }
                          return upaid;
                        },
                        { count: 0, value: 0 }
                      );
                      paid.count += uPayments.count;
                      paid.value += uPayments.value;
                    }
                  }
                  return paid;
                },
                { count: 0, value: 0 }
              );
              metricInfo.count += value.count;
              metricInfo.value += value.value;
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      take(1)
    );
  }

  nortanValue(
    start: Date,
    end: Date,
    type: 'nortan' | 'taxes' = 'nortan',
    uId?: string
  ): Observable<UserAndGlobalMetric> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: UserAndGlobalMetric, contract) => {
            if (this.contractService.hasReceipts(contract._id)) {
              const value = contract.receipts
                .filter((receipt) => receipt.paid)
                .reduce(
                  (paid: UserAndGlobalMetric, receipt) => {
                    const paidDate = receipt.paidDate;
                    if (paidDate && this.utils.isWithinInterval(paidDate, start, end)) {
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
    return this.teamService.getTeams().pipe(
      map((teams) => {
        return this.teamService
          .idToTeam(tId)
          .expenses.filter((expense) => expense.paid)
          .reduce(
            (acc, expense) => {
              const paidDate = expense.paidDate;
              if (paidDate && this.utils.isWithinInterval(paidDate, start, end)) {
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
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
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
    return this.contractService.getContracts().pipe(
      map((contracts) => {
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
        return this.utils.groupByDateTimeSerie(timeSeriesItemsFlat);
      })
    );
  }

  expensesTimeSeries(uId?: string): Observable<TimeSeriesItem[]> {
    return this.contractService.getContracts().pipe(
      map((contracts) => {
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
        return this.utils.groupByDateTimeSerie(timeSeriesItemsFlat);
      })
    );
  }

  contractValueTimeSeries(uId?: string): Observable<TimeSeriesItem[]> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
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
        return this.utils.groupByDateTimeSerie(timeSeriesItems);
      })
    );
  }

  userReceivableValue(uId: string): Observable<UserReceivable> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
    ]).pipe(
      filter(
        ([contracts, invoices, contractors]) => contracts.length > 0 && invoices.length > 0 && contractors.length > 0
      ),
      map(([contracts, invoices, contractors]) => {
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

  private receivableValue(contract: Contract, member: InvoiceTeamMember): string {
    const notPaid = this.contractService.notPaidValue(member.distribution, member.user, contract);
    const cashback = this.stringUtil.numberToMoney(
      this.contractService.expensesContributions(contract, member.user).user.cashback
    );

    return this.stringUtil.sumMoney(notPaid, cashback);
  }
}
