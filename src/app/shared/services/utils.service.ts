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
import { at, groupBy } from 'lodash';
import { TimeSeriesItem } from './metrics.service';
import { NgModel } from '@angular/forms';

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

  nameSort(direction = 1, a: string, b: string): number {
    return a
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') <
      b
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      ? -1 * direction
      : direction;
  }

  codeSort(direction: number, a: string, b: string): number {
    let first = { count: 0, year: 0 };
    let second = { count: 0, year: 0 };
    let tmp = { count: a.match(/-(\d+)\//g), year: a.match(/\/(\d+)-/g) };
    if (tmp.count && tmp.year)
      tmp = {
        count: tmp.count[0].match(/\d+/g),
        year: tmp.year[0].match(/\d+/g),
      };
    if (tmp.count && tmp.year)
      first = { count: +tmp.count[0], year: +tmp.year[0] };
    tmp = { count: b.match(/-(\d+)\//g), year: b.match(/\/(\d+)-/g) };
    if (tmp.count && tmp.year)
      tmp = {
        count: tmp.count[0].match(/\d+/g),
        year: tmp.year[0].match(/\d+/g),
      };
    if (tmp.count && tmp.year)
      second = { count: +tmp.count[0], year: +tmp.year[0] };

    if (first.year < second.year) return -1 * direction;

    if (first.year > second.year) return direction;

    if (first.year == second.year) {
      if (first.count < second.count) return -1 * direction;
      else return direction;
    }
    return 0;
  }

  groupByDateTimeSerie(serie: TimeSeriesItem[]): TimeSeriesItem[] {
    return Object.entries(groupBy(serie, '0'))
      .map((objs) => {
        return [
          objs[0],
          objs[1].reduce((acc, obj) => acc + obj[1], 0),
        ] as TimeSeriesItem;
      })
      .sort((a, b) => {
        return a[0] < b[0] ? -1 : 1;
      });
  }

  forceValidatorUpdate(model: NgModel, time = 1): void {
    setTimeout(() => {
      model.control.updateValueAndValidity();
    }, time);
  }

  trackByIndex<T>(index: number, obj: T): number {
    return index;
  }

  isOfType<T>(obj: any, properties: NonOptionalKeys<T>[]): obj is T {
    const values = at(obj, properties);
    return !values.includes(undefined);
  }
}
