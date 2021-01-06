import { Injectable, OnDestroy } from '@angular/core';
import { ContractService } from './contract.service';
import { ContractorService } from './contractor.service';
import { InvoiceService } from './invoice.service';
import { UserService } from './user.service';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import {
  parseISO,
  isSameMonth,
  isWithinInterval,
  subMonths,
  startOfMonth,
  startOfYear,
  endOfYear,
  addMonths,
  addYears,
} from 'date-fns';
import { endOfMonth, subYears, subDays } from 'date-fns/esm';
import { StringUtilService } from './string-util.service';

interface MetricInfo {
  count: number;
  value: number;
}

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor(
    private contractService: ContractService,
    private contractorService: ContractorService,
    private invoiceService: InvoiceService,
    private userService: UserService,
    private stringUtil: StringUtilService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  plural(last: string, number: number): string {
    switch (last) {
      case 'Dia': {
        return number > 1 ? 'Nos últimos ' + number + ' dias' : 'Ontem';
      }
      case 'Mês': {
        return number > 1
          ? 'Nos últimos ' + number + ' meses'
          : 'No mês passado';
      }
      case 'Ano': {
        return number > 1
          ? 'Nos últimos ' + number + ' anos'
          : 'No ano passado';
      }
      default: {
        return '';
      }
    }
  }

  private compareDates(
    date: any,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): boolean {
    switch (last) {
      case 'Hoje': {
        return isSameMonth(new Date(), date);
      }
      case 'Dia': {
        return isWithinInterval(date, {
          start: subDays(new Date(), number),
          end: new Date(),
        });
      }
      case 'Mês': {
        const lastMonthStart = fromToday
          ? subMonths(new Date(), number)
          : startOfMonth(subMonths(new Date(), number));
        const lastMonthEnd = fromToday
          ? new Date()
          : endOfMonth(addMonths(lastMonthStart, number - 1));
        return isWithinInterval(date, {
          start: lastMonthStart,
          end: lastMonthEnd,
        });
      }
      case 'Ano': {
        const lastYearStart = fromToday
          ? subYears(new Date(), number)
          : startOfYear(subYears(new Date(), number));
        const lastYearEnd = fromToday
          ? new Date()
          : endOfYear(addYears(lastYearStart, number - 1));
        return isWithinInterval(date, {
          start: lastYearStart,
          end: lastYearEnd,
        });
      }
      default: {
      }
    }
  }

  contractsAsManger(
    uId: string,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest(
      this.contractService.getContracts(),
      this.invoiceService.getInvoices()
    ).pipe(
      map(([contracts, invoices]) => {
        if (contracts.length > 0 && invoices.length > 0)
          return contracts.reduce(
            (metricInfo: MetricInfo, contract) => {
              let created = contract.created;
              if (typeof created !== 'object') created = parseISO(created);
              if (
                this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
                this.compareDates(created, last, number, fromToday)
              ) {
                const invoice =
                  contract.invoice?._id == undefined
                    ? this.invoiceService.idToInvoice(contract.invoice)
                    : contract.invoice;
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(
                  invoice.value
                );
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
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return this.invoiceService.getInvoices().pipe(
      map((invoices) => {
        if (invoices.length > 0)
          return invoices.reduce(
            (metricInfo: MetricInfo, invoice) => {
              let created = invoice.created;
              if (typeof created !== 'object') created = parseISO(created);
              if (
                this.invoiceService.isInvoiceAuthor(invoice, uId) &&
                this.compareDates(created, last, number, fromToday)
              ) {
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(
                  invoice.value
                );
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
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest(
      this.contractService.getContracts(),
      this.invoiceService.getInvoices()
    ).pipe(
      map(([contracts, invoices]) => {
        if (contracts.length > 0 && invoices.length > 0)
          return contracts.reduce(
            (metricInfo: MetricInfo, contract) => {
              let created = contract.created;
              if (typeof created !== 'object') created = parseISO(created);
              if (
                this.invoiceService.isInvoiceMember(contract.invoice, uId) &&
                this.compareDates(created, last, number, fromToday)
              ) {
                const invoice =
                  contract.invoice?._id == undefined
                    ? this.invoiceService.idToInvoice(contract.invoice)
                    : contract.invoice;
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(
                  invoice.value
                );
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
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return this.invoiceService.getInvoices().pipe(
      map((invoices) => {
        if (invoices.length > 0)
          return invoices.reduce(
            (metricInfo: MetricInfo, invoice) => {
              let created = invoice.created;
              if (typeof created !== 'object') created = parseISO(created);
              if (
                this.invoiceService.isInvoiceMember(invoice, uId) &&
                this.compareDates(created, last, number, fromToday)
              ) {
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(
                  invoice.value
                );
              }
              return metricInfo;
            },
            { count: 0, value: 0 }
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  receivedValue(
    uId: string,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<number> {
    return this.contractService.getContracts().pipe(
      map((contracts) => {
        if (contracts.length > 0)
          return contracts.reduce((received, contract) => {
            if (this.contractService.hasPayments(contract._id, uId)) {
              const value = contract.payments.reduce((paid, payment) => {
                if (payment.paid != 'não') {
                  let paidDate = payment.paidDate;
                  if (typeof paidDate !== 'object')
                    paidDate = parseISO(paidDate);
                  if (this.compareDates(paidDate, last, number, fromToday))
                    return (
                      paid +
                      payment.team.reduce((upaid, member) => {
                        const author =
                          member.user._id == undefined
                            ? member.user
                            : member.user._id;
                        if (author == uId)
                          return (
                            upaid + this.stringUtil.moneyToNumber(member.value)
                          );
                        return upaid;
                      }, 0)
                    );
                }
                return paid;
              }, 0);
              return received + value;
            }
            return received;
          }, 0);
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContracts(
    role: 'manager' | 'member',
    uId: string,
    last = 'Mês',
    number = 1,
    fromToday = false
  ): Observable<number> {
    /* eslint-disable @typescript-eslint/indent */
    const combined$ =
      role == 'manager'
        ? combineLatest(
            this.contractsAsManger(uId, last, number, fromToday),
            this.invoicesAsManger(uId, last, number, fromToday)
          )
        : combineLatest(
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember(uId, last, number, fromToday)
          );
    /* eslint-enable @typescript-eslint/indent */
    return combined$.pipe(
      map(([contracts, invoices]) => {
        if (contracts != undefined && invoices != undefined)
          return this.stringUtil.moneyToNumber(
            this.stringUtil
              .toPercentage(
                contracts.count.toString(),
                invoices.count.toString()
              )
              .slice(0, -1)
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContractsValue(
    role: 'manager' | 'member',
    uId: string,
    last = 'Mês',
    number = 1,
    fromToday = false
  ): Observable<number> {
    /* eslint-disable @typescript-eslint/indent */
    const combined$ =
      role == 'manager'
        ? combineLatest(
            this.contractsAsManger(uId, last, number, fromToday),
            this.invoicesAsManger(uId, last, number, fromToday)
          )
        : combineLatest(
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember(uId, last, number, fromToday)
          );
    /* eslint-enable @typescript-eslint/indent */
    return combined$.pipe(
      map(([contracts, invoices]) => {
        if (contracts != undefined && invoices != undefined)
          return this.stringUtil.moneyToNumber(
            this.stringUtil
              .toPercentage(
                contracts.value.toString(),
                invoices.value.toString()
              )
              .slice(0, -1)
          );
      }),
      takeUntil(this.destroy$)
    );
  }
}
