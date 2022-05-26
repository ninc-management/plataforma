import { DEFAULT_MEDIA_BREAKPOINTS, NbTrigger } from '@nebular/theme';
import { NgModel } from '@angular/forms';
import {
  addMonths,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  isSameMonth,
  isWithinInterval as withinInterval,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInDays,
  parseISO,
} from 'date-fns';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { at, groupBy, isEqual } from 'lodash';
import { TimeSeriesItem } from './services/metrics.service';
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

let doc: any = document;
export const tooltipTriggers = NbTrigger;

export function isPhone(): boolean {
  const breakpoints = DEFAULT_MEDIA_BREAKPOINTS.reduce((res: any, breakpoint) => {
    res[breakpoint.name] = breakpoint.width;
    return res;
  }, {});
  return doc.documentElement.clientWidth <= breakpoints['md'];
}

export function mockDocument(d: { documentElement: { clientWidth: number } }): void {
  doc = d;
}

export function nfPercentage(iDocument: Contract | Invoice): string {
  let invoice!: Invoice;
  if (isOfType<Invoice>(iDocument, ['administration'])) {
    invoice = iDocument;
  } else {
    if (iDocument.receipts.length > 0) return iDocument.receipts[0].notaFiscal;
    if (isOfType<Invoice>(iDocument.invoice, ['_id', 'author', 'nortanTeam', 'sector', 'code', 'type', 'contractor']))
      invoice = iDocument.invoice;
    else return '0';
  }

  if (invoice.administration == 'nortan') {
    if (invoice.nortanTeam) {
      if (isOfType<Team>(invoice.nortanTeam, ['_id', 'name', 'members', 'config']))
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

export function nortanPercentage(iDocument: Contract | Invoice): string {
  let invoice!: Invoice;
  if (isOfType<Invoice>(iDocument, ['administration'])) {
    invoice = iDocument;
  } else {
    if (iDocument.receipts?.length > 0) return iDocument.receipts[0].nortanPercentage;
    if (isOfType<Invoice>(iDocument.invoice, ['_id', 'author', 'nortanTeam', 'sector', 'code', 'type', 'contractor']))
      invoice = iDocument.invoice;
    else return '0';
  }

  if (invoice.nortanTeam) {
    if (isOfType<Team>(invoice.nortanTeam, ['_id', 'name', 'members', 'config']))
      return invoice.nortanTeam._id == '6201b405329f446f16e1b404'
        ? '0'
        : invoice.administration == 'nortan'
        ? '15'
        : '18';
    else
      return invoice.nortanTeam == '6201b405329f446f16e1b404' ? '0' : invoice.administration == 'nortan' ? '15' : '18';
  }
  return invoice.administration == 'nortan' ? '15' : '18';
}

export function assingOrIncrement(base: number | undefined, increment: number): number {
  let result = 0;
  if (base != undefined) result += base;
  result += increment;
  return result;
}

export function isValidDate(
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
      return isWithinInterval(date, subDays(new Date(), number), new Date());
    }
    case 'Mês': {
      const lastMonthStart = fromToday ? subMonths(new Date(), number) : startOfMonth(subMonths(new Date(), number));
      const lastMonthEnd = fromToday ? new Date() : endOfMonth(addMonths(lastMonthStart, number - 1));
      return isWithinInterval(date, lastMonthStart, lastMonthEnd);
    }
    case 'Ano': {
      const lastYearStart = fromToday ? subYears(new Date(), number) : startOfYear(subYears(new Date(), number));
      const lastYearEnd = fromToday ? new Date() : endOfYear(addYears(lastYearStart, number - 1));
      return isWithinInterval(date, lastYearStart, lastYearEnd);
    }
    default: {
      return false;
    }
  }
}

export function formatDate(date: Date, divider = '/'): string {
  return format(date, 'dd' + divider + 'MM' + divider + 'yyyy');
}

export function isWithinInterval(date: Date, start: Date, end: Date): boolean {
  return withinInterval(date, {
    start: start,
    end: end,
  });
}

export function nameSort(direction = 1, a: string, b: string): number {
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

export function codeSort(direction: number, a: string, b: string): number {
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

//INVARIANT: The number of decimal places of the two numbers must be equal
export function valueSort(direction: number, a: string, b: string): number {
  const first = +a.replace(/[,.]/g, '');
  const second = +b.replace(/[,.]/g, '');

  if (first < second) {
    return -1 * direction;
  }
  if (first > second) {
    return direction;
  }
  return 0;
}

export function groupByDateTimeSerie(serie: TimeSeriesItem[]): TimeSeriesItem[] {
  return Object.entries(groupBy(serie, '0'))
    .map((objs) => {
      return [objs[0], objs[1].reduce((acc, obj) => acc + obj[1], 0)] as TimeSeriesItem;
    })
    .sort((a, b) => {
      return a[0] < b[0] ? -1 : 1;
    });
}

export function forceValidatorUpdate(model: NgModel, time = 1): void {
  setTimeout(() => {
    model.control.updateValueAndValidity();
  }, time);
}

export function trackByIndex<T>(index: number, obj: T): number {
  return index;
}

export function isOfType<T>(obj: any, properties: NonOptionalKeys<T>[]): obj is T {
  const values = at(obj, properties);
  return !values.includes(undefined);
}

export function NOT(o$: Observable<boolean>): Observable<boolean> {
  return o$.pipe(map((result: boolean) => !result));
}

export function chunkify<T>(array: T[], split_size: number, balanced = true): T[][] {
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

export function compareFiles(initialFiles: UploadedFile[], file: UploadedFile): boolean {
  let condition: boolean = false;
  initialFiles.forEach((initialFile) => {
    if (isEqual(initialFile, file)) condition = true;
  });
  return condition;
}

/**
 * Return a property of an object given its reference and revival export function
 * @param {Parameters<F>[0] | undefined} id
 * @param {F} revival
 * @param {keyof ReturnType<F>} property
 * @returns {any}
 */
export function idToProperty<F extends (...arg: any) => ReturnType<F>>(
  id: Parameters<F>[0] | undefined,
  revival: F,
  property: keyof ReturnType<F>
): any {
  if (id) return revival(id)[property];
  return '';
}

export function elapsedTime(time: Date, elapsedLocalTime: Date = new Date()): string {
  const days = differenceInDays(elapsedLocalTime.getTime(), time.getTime());
  const hours = differenceInHours(elapsedLocalTime.getTime(), time.getTime());
  const minutes = differenceInMinutes(elapsedLocalTime.getTime(), time.getTime());
  const seconds = differenceInSeconds(elapsedLocalTime.getTime(), time.getTime());

  if (days > 0) return days === 1 ? `há ${days} dia` : `há ${days} dias`;
  else if (hours !== 0) return hours === 1 ? `há ${hours} hora atrás` : `há ${hours} horas atrás`;
  else if (minutes !== 0) return minutes === 1 ? `há ${minutes} minuto atrás` : `há ${minutes} minutos atrás`;
  else return seconds === 1 ? `há ${seconds} segundo atrás` : `há ${seconds} segundos atrás`;
}

export function reviveDates<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj), (key, value) => {
    if (['created', 'lastUpdate', 'paidDate', 'start', 'end', 'date', 'finishedDate'].includes(key))
      return parseISO(value);
    return value;
  }) as T;
}