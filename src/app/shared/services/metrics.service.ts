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
} from 'date-fns';
import { endOfMonth, subYears, subDays } from 'date-fns/esm';

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor(
    private contractService: ContractService,
    private contractorService: ContractorService,
    private invoiceService: InvoiceService,
    private userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private plural(last: string, number: number) {
    switch (last) {
      case 'Dia': {
        return number > 1 ? 'Nos últimos ' + number + ' dias' : 'Ontem';
      }
      case 'Mês': {
        return number > 1
          ? 'Nos últimos ' + number + ' mêses'
          : 'No mês passado';
      }
      case 'Ano': {
        return number > 1
          ? 'Nos últimos ' + number + ' anos'
          : 'No ano passado';
      }
      default: {
      }
    }
  }

  private compareDates(date: any, last = 'Hoje', number = 1): boolean {
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
        const lastMonthStart = startOfMonth(subMonths(new Date(), number));
        return isWithinInterval(date, {
          start: lastMonthStart,
          end: endOfMonth(lastMonthStart),
        });
      }
      case 'Ano': {
        const lastYearStart = startOfYear(subYears(new Date(), number));
        return isWithinInterval(date, {
          start: lastYearStart,
          end: endOfYear(lastYearStart),
        });
      }
      default: {
      }
    }
  }

  contractsAsManger(
    uid: string,
    last = 'Hoje',
    number = 1
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
            const author =
              contract.invoice._id == undefined
                ? this.invoiceService.idToInvoice(contract.invoice).author
                : this.invoiceService.idToInvoice(contract.invoice._id).author;
            return (
              (author?._id == undefined ? author : author._id) == uid &&
              this.compareDates(created, last, number)
            );
          }).length;
      }),
      takeUntil(this.destroy$)
    );
  }

  contractsAsMangerLast(
    uid: string,
    last = 'Mês',
    number = 1
  ): Observable<string> {
    return this.contractsAsManger(uid, last, number).pipe(
      map((pastContracts) => {
        return (
          this.plural(last, number) +
          ' você fechou ' +
          pastContracts +
          (pastContracts > 1 ? ' contratos' : ' contrato')
        );
      })
    );
  }
}
