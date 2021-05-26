import { Injectable } from '@angular/core';
import { NbMediaBreakpointsService } from '@nebular/theme';
import {
  addMonths,
  addYears,
  endOfMonth,
  endOfYear,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { Contract } from '../../../../backend/src/models/contract';
import { Invoice } from '../../../../backend/src/models/invoice';
import * as _ from 'lodash';

type NonOptionalKeys<T> = {
  [K in keyof T]-?: T extends { [K1 in K]: any } ? K : never;
}[keyof T];

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(private breakpointService: NbMediaBreakpointsService) {}

  isPhone(): boolean {
    const { sm } = this.breakpointService.getBreakpointsMap();
    return document.documentElement.clientWidth <= sm;
  }

  nfPercentage(document: Contract | Invoice): string {
    let invoice!: Invoice;
    if (this.isOfType<Invoice>(document, ['administration'])) {
      invoice = document;
    } else {
      if (document.receipts.length > 0) return document.receipts[0].notaFiscal;
      if (
        this.isOfType<Invoice>(document.invoice, [
          '_id',
          'author',
          'department',
          'coordination',
          'code',
          'type',
          'contractor',
        ])
      )
        invoice = document.invoice;
      else return '0';
    }

    if (
      invoice.department == 'DEC' ||
      invoice.department == 'DEC - Diretoria de Engenharia Civil' ||
      invoice.department == 'DAD' ||
      invoice.department == 'DAD - Diretoria de Administração'
    )
      return '8,5';
    else return '15,5';
  }

  nortanPercentage(document: Contract | Invoice): string {
    let invoice!: Invoice;
    if (this.isOfType<Invoice>(document, ['administration'])) {
      invoice = document;
    } else {
      if (document.receipts?.length > 0)
        return document.receipts[0].nortanPercentage;
      if (
        this.isOfType<Invoice>(document.invoice, [
          '_id',
          'author',
          'department',
          'coordination',
          'code',
          'type',
          'contractor',
        ])
      )
        invoice = document.invoice;
      else return '0';
    }
    if (
      invoice.department == 'DAD' ||
      invoice.department == 'DAD - Diretoria de Administração'
    )
      return '0';
    return invoice.administration == 'nortan' ? '15' : '17';
  }

  // https://stackoverflow.com/a/42488360
  sumObjectsByKey<T>(...objs: any): any {
    return objs.reduce((a, b) => {
      for (const k in b) {
        if (b.hasOwnProperty(k)) a[k] = (a[k] || 0) + b[k];
      }
      return a;
    }, {});
  }

  assingOrIncrement(base: number, increment: number): number {
    let result = 0;
    if (base != undefined) result += base;
    result += increment;
    return result;
  }

  compareDates(
    date: number | Date,
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

  trackByIndex<T>(index: number, obj: T): number {
    return index;
  }

  isOfType<T>(obj: any, properties: NonOptionalKeys<T>[]): obj is T {
    const values = _.at(obj, properties);
    return !values.includes(undefined);
  }
}
