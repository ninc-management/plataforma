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
    uId: string,
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
            return (
              this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
              this.compareDates(created, last, number)
            );
          }).length;
      }),
      takeUntil(this.destroy$)
    );
  }

  contractsAsMangerLast(
    uId: string,
    last = 'Mês',
    number = 1
  ): Observable<string> {
    return this.contractsAsManger(uId, last, number).pipe(
      map((pastContracts) => {
        return (
          this.plural(last, number) +
          ' você fechou ' +
          (pastContracts == 0 ? 'nenhum' : pastContracts) +
          (pastContracts > 1 ? ' contratos' : ' contrato')
        );
      })
    );
  }

  contractsAsMember(
    uId: string,
    last = 'Hoje',
    number = 1
  ): Observable<number> {
    return combineLatest(
      this.contractService.getContracts(),
      this.invoiceService.getInvoices()
    ).pipe(
      map(([contracts, invoices]) => {
        if (contracts.length > 0 && invoices.length > 0) {
          return contracts.filter((contract) => {
            let created = contract.created;
            if (typeof created !== 'object') created = parseISO(created);
            return (
              this.invoiceService.isInvoiceMember(contract.invoice, uId) &&
              this.compareDates(created, last, number)
            );
          }).length;
        }
      }),
      takeUntil(this.destroy$)
    );
  }

  contractsAsMemberLast(
    uId: string,
    last = 'Mês',
    number = 1
  ): Observable<string> {
    return this.contractsAsMember(uId, last, number).pipe(
      map((pastContracts) => {
        return (
          this.plural(last, number) +
          ' você participou de ' +
          (pastContracts == 0 ? 'nenhum' : pastContracts) +
          (pastContracts > 1 ? ' contratos' : ' contrato')
        );
      })
    );
  }
}
