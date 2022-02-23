import { Injectable } from '@angular/core';
import { NbMediaBreakpointsService, NbTrigger } from '@nebular/theme';
import { NgModel } from '@angular/forms';
import {
  addMonths,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { at, groupBy, isEqual } from 'lodash';
import { TimeSeriesItem } from './metrics.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Team } from '@models/team';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';

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

  nfPercentage(iDocument: Contract | Invoice): string {
    let invoice!: Invoice;
    if (this.isOfType<Invoice>(iDocument, ['administration'])) {
      invoice = iDocument;
    } else {
      if (iDocument.receipts.length > 0) return iDocument.receipts[0].notaFiscal;
      if (
        this.isOfType<Invoice>(iDocument.invoice, [
          '_id',
          'author',
          'nortanTeam',
          'sector',
          'code',
          'type',
          'contractor',
        ])
      )
        invoice = iDocument.invoice;
      else return '0';
    }

    if (invoice.administration == 'nortan') {
      if (invoice.nortanTeam) {
        if (this.isOfType<Team>(invoice.nortanTeam, ['_id', 'name', 'members', 'config']))
          return invoice.nortanTeam._id == '61362107f04ddc1a6a59f390' ||
            invoice.nortanTeam._id == '614b58d90d2cf0435ea59e52' ||
            invoice.nortanTeam._id == '613236a07f6ed15db318c7d8'
            ? '8,5'
            : '15,5';
        else
          return invoice.nortanTeam == '61362107f04ddc1a6a59f390' ||
            invoice.nortanTeam == '614b58d90d2cf0435ea59e52' ||
            invoice.nortanTeam == '613236a07f6ed15db318c7d8'
            ? '8,5'
            : '15,5';
      } else return '0';
    } else return '0';
  }

  nortanPercentage(iDocument: Contract | Invoice): string {
    let invoice!: Invoice;
    if (this.isOfType<Invoice>(iDocument, ['administration'])) {
      invoice = iDocument;
    } else {
      if (iDocument.receipts?.length > 0) return iDocument.receipts[0].nortanPercentage;
      if (
        this.isOfType<Invoice>(iDocument.invoice, [
          '_id',
          'author',
          'nortanTeam',
          'sector',
          'code',
          'type',
          'contractor',
        ])
      )
        invoice = iDocument.invoice;
      else return '0';
    }

    if (invoice.nortanTeam) {
      if (this.isOfType<Team>(invoice.nortanTeam, ['_id', 'name', 'members', 'config']))
        return invoice.nortanTeam._id == '6201b405329f446f16e1b404'
          ? '0'
          : invoice.administration == 'nortan'
          ? '15'
          : '17';
      else
        return invoice.nortanTeam == '6201b405329f446f16e1b404'
          ? '0'
          : invoice.administration == 'nortan'
          ? '15'
          : '17';
    }
    return invoice.administration == 'nortan' ? '15' : '17';
  }

  assingOrIncrement(base: number | undefined, increment: number): number {
    let result = 0;
    if (base != undefined) result += base;
    result += increment;
    return result;
  }

  isValidDate(date: Date, last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje', number = 1, fromToday = false): boolean {
    switch (last) {
      case 'Hoje': {
        return isSameMonth(new Date(), date);
      }
      case 'Dia': {
        return this.isWithinInterval(date, subDays(new Date(), number), new Date());
      }
      case 'Mês': {
        const lastMonthStart = fromToday ? subMonths(new Date(), number) : startOfMonth(subMonths(new Date(), number));
        const lastMonthEnd = fromToday ? new Date() : endOfMonth(addMonths(lastMonthStart, number - 1));
        return this.isWithinInterval(date, lastMonthStart, lastMonthEnd);
      }
      case 'Ano': {
        const lastYearStart = fromToday ? subYears(new Date(), number) : startOfYear(subYears(new Date(), number));
        const lastYearEnd = fromToday ? new Date() : endOfYear(addYears(lastYearStart, number - 1));
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
    if (tmp.count && tmp.year) first = { count: +tmp.count[0], year: +tmp.year[0] };
    tmp = { count: b.match(/-(\d+)\//g), year: b.match(/\/(\d+)-/g) };
    if (tmp.count && tmp.year)
      tmp = {
        count: tmp.count[0].match(/\d+/g),
        year: tmp.year[0].match(/\d+/g),
      };
    if (tmp.count && tmp.year) second = { count: +tmp.count[0], year: +tmp.year[0] };

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
        return [objs[0], objs[1].reduce((acc, obj) => acc + obj[1], 0)] as TimeSeriesItem;
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

  NOT(o$: Observable<boolean>): Observable<boolean> {
    return o$.pipe(map((result: boolean) => !result));
  }

  chunkify<T>(array: T[], split_size: number, balanced = true): T[][] {
    if (split_size < 2) return [array];

    const len = array.length;
    const out: T[][] = [];
    let i = 0;
    let size: number = 0;

    if (len % split_size === 0) {
      size = Math.floor(len / split_size);
      while (i < len) {
        out.push(array.slice(i, (i += size)));
      }
    } else if (balanced) {
      while (i < len) {
        size = Math.ceil((len - i) / split_size--);
        out.push(array.slice(i, (i += size)));
      }
    } else {
      split_size--;
      size = Math.floor(len / split_size);
      if (len % size === 0) size--;
      while (i < size * split_size) {
        out.push(array.slice(i, (i += size)));
      }
      out.push(array.slice(size * split_size));
    }

    return out;
  }

  compareFiles(initialFiles: UploadedFile[], file: UploadedFile): boolean {
    let condition: boolean = false;
    initialFiles.forEach((initialFile) => {
      if (isEqual(initialFile, file)) condition = true;
    });
    return condition;
  }
}
