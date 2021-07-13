import { Injectable } from '@angular/core';
import { NbMediaBreakpointsService, NbTrigger } from '@nebular/theme';
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
  format,
} from 'date-fns';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { at } from 'lodash';

export enum Permissions {
  PARCEIRO = 'parceiro',
  CLIENTE = 'cliente',
  ASSOCIADO = 'associado',
  ELO_PRINCIPAL = 'elo-principal',
  DIRETOR_FINANCEIRO = 'df',
  DIRETOR_ADMINISTRATIVO = 'da',
  AER = 'aer',
  ELO_NORTAN = 'elo-nortan',
  DIRETOR_TI = 'dti',
}

type NonOptionalKeys<T> = {
  [K in keyof T]-?: T extends { [K1 in K]: any } ? K : never;
}[keyof T];

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  document: any = document;
  tooltipTriggers = NbTrigger;

  constructor(private breakpointService: NbMediaBreakpointsService) {}

  isPhone(): boolean {
    const { md } = this.breakpointService.getBreakpointsMap();
    return this.document.documentElement.clientWidth <= md;
  }

  mockDocument(d: { documentElement: { clientWidth: number } }): void {
    this.document = d;
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

    if (invoice.administration == 'nortan') {
      if (
        invoice.department == 'DEC' ||
        invoice.department == 'DEC - Diretoria de Engenharia Civil' ||
        invoice.department == 'DAD' ||
        invoice.department == 'DAD - Diretoria de Administração'
      )
        return '8,5';
      else return '15,5';
    } else return '0';
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

  assingOrIncrement(base: number | undefined, increment: number): number {
    let result = 0;
    if (base != undefined) result += base;
    result += increment;
    return result;
  }

  isValidDate(
    date: Date,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): boolean {
    switch (last) {
      case 'Hoje': {
        return isSameMonth(new Date(), date);
      }
      case 'Dia': {
        return this.isWithinInterval(
          date,
          subDays(new Date(), number),
          new Date()
        );
      }
      case 'Mês': {
        const lastMonthStart = fromToday
          ? subMonths(new Date(), number)
          : startOfMonth(subMonths(new Date(), number));
        const lastMonthEnd = fromToday
          ? new Date()
          : endOfMonth(addMonths(lastMonthStart, number - 1));
        return this.isWithinInterval(date, lastMonthStart, lastMonthEnd);
      }
      case 'Ano': {
        const lastYearStart = fromToday
          ? subYears(new Date(), number)
          : startOfYear(subYears(new Date(), number));
        const lastYearEnd = fromToday
          ? new Date()
          : endOfYear(addYears(lastYearStart, number - 1));
        return this.isWithinInterval(date, lastYearStart, lastYearEnd);
      }
      default: {
        return false;
      }
    }
  }

  formatDate(date: Date, divider = '/'): string {
    return format(date, 'dd' + divider + 'MM' + divider + 'yyyy');
  }

  isWithinInterval(date: Date, start: Date, end: Date): boolean {
    return isWithinInterval(date, {
      start: start,
      end: end,
    });
  }

  trackByIndex<T>(index: number, obj: T): number {
    return index;
  }

  isOfType<T>(obj: any, properties: NonOptionalKeys<T>[]): obj is T {
    const values = at(obj, properties);
    return !values.includes(undefined);
  }
}
