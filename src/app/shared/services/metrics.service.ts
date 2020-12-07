import { Injectable, OnDestroy } from '@angular/core';
import { ContractService } from './contract.service';
import { ContractorService } from './contractor.service';
import { InvoiceService } from './invoice.service';
import { UserService } from './user.service';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map, tap } from 'rxjs/operators';
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
    untilToday = false
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
        const lastMonthStart = untilToday
          ? subMonths(new Date(), number)
          : startOfMonth(subMonths(new Date(), number));
        const lastMonthEnd = untilToday
          ? new Date()
          : endOfMonth(addMonths(lastMonthStart, number - 1));
        return isWithinInterval(date, {
          start: lastMonthStart,
          end: lastMonthEnd,
        });
      }
      case 'Ano': {
        const lastYearStart = untilToday
          ? subYears(new Date(), number)
          : startOfYear(subYears(new Date(), number));
        const lastYearEnd = untilToday
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
    untilToday = false
  ): Observable<number> {
    return combineLatest(
      this.contractService.getContracts(),
      this.invoiceService.getInvoices()
    ).pipe(
      map(([contracts, invoices]) => {
        if (contracts.length > 0 && invoices.length > 0)
          return contracts.filter((contract) => {
            let created = contract.created;
            if (typeof created !== 'object') created = parseISO(created);
            return (
              this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
              this.compareDates(created, last, number, untilToday)
            );
          }).length;
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesAsManger(
    uId: string,
    last = 'Hoje',
    number = 1,
    untilToday = false
  ): Observable<number> {
    return this.invoiceService.getInvoices().pipe(
      map((invoices) => {
        if (invoices.length > 0)
          return invoices.filter((invoice) => {
            let created = invoice.created;
            if (typeof created !== 'object') created = parseISO(created);
            return (
              this.invoiceService.isInvoiceAuthor(invoice, uId) &&
              this.compareDates(created, last, number, untilToday)
            );
          }).length;
      }),
      takeUntil(this.destroy$)
    );
  }

  contractsAsMember(
    uId: string,
    last = 'Hoje',
    number = 1,
    untilToday = false
  ): Observable<number> {
    return combineLatest(
      this.contractService.getContracts(),
      this.invoiceService.getInvoices()
    ).pipe(
      map(([contracts, invoices]) => {
        if (contracts.length > 0 && invoices.length > 0)
          return contracts.filter((contract) => {
            let created = contract.created;
            if (typeof created !== 'object') created = parseISO(created);
            return (
              this.invoiceService.isInvoiceMember(contract.invoice, uId) &&
              this.compareDates(created, last, number, untilToday)
            );
          }).length;
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesAsMember(
    uId: string,
    last = 'Hoje',
    number = 1,
    untilToday = false
  ): Observable<number> {
    return this.invoiceService.getInvoices().pipe(
      map((invoices) => {
        if (invoices.length > 0)
          return invoices.filter((invoice) => {
            let created = invoice.created;
            if (typeof created !== 'object') created = parseISO(created);
            return (
              this.invoiceService.isInvoiceMember(invoice, uId) &&
              this.compareDates(created, last, number, untilToday)
            );
          }).length;
      }),
      takeUntil(this.destroy$)
    );
  }

  receivedValue(
    uId: string,
    last = 'Hoje',
    number = 1,
    untilToday = false
  ): Observable<number> {
    return combineLatest(
      this.contractService.getContracts(),
      this.invoiceService.getInvoices()
    ).pipe(
      map(([contracts, invoices]) => {
        if (contracts.length > 0 && invoices.length > 0)
          return contracts.reduce((received, contract) => {
            let created = contract.created;
            if (typeof created !== 'object') created = parseISO(created);
            const paid = this.contractService.hasPayments(contract._id, uId);
            if (
              this.compareDates(created, last, number, untilToday) &&
              paid.hasPayments
            )
              return (received += paid.value);
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
    untilToday = false
  ): Observable<number> {
    /* eslint-disable @typescript-eslint/indent */
    const combined$ =
      role == 'manager'
        ? combineLatest(
            this.contractsAsManger(uId, last, number, untilToday),
            this.invoicesAsManger(uId, last, number, untilToday)
          )
        : combineLatest(
            this.contractsAsMember(uId, last, number, untilToday),
            this.invoicesAsMember(uId, last, number, untilToday)
          );
    /* eslint-enable @typescript-eslint/indent */
    return combined$.pipe(
      map(([contracts, invoices]) => {
        if (contracts != undefined && invoices != undefined)
          return this.stringUtil.moneyToNumber(
            this.stringUtil
              .toPercentage(contracts.toString(), invoices.toString())
              .slice(0, -1)
          );
      }),
      takeUntil(this.destroy$)
    );
  }
}
