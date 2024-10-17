import { NgModel } from '@angular/forms';
import { DEFAULT_MEDIA_BREAKPOINTS, NbTrigger } from '@nebular/theme';
import {
  addMonths,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  endOfMonth,
  endOfYear,
  format,
  isBefore,
  isSameMonth,
  lastDayOfMonth,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
  isWithinInterval as withinInterval,
} from 'date-fns';
import { cloneDeep, groupBy, isEqual } from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { appInjector } from './injector.module';
import { InvoiceService } from './services/invoice.service';
import { TimeSeriesItem } from './services/metrics.service';
import { TeamService } from './services/team.service';
import { moneyToNumber } from './string-utils';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';

import { Contract, ContractExpense, ContractPayment, ContractReceipt } from '@models/contract';
import { Invoice } from '@models/invoice';
import { Notification } from '@models/notification';
import { InvoiceConfig } from '@models/platformConfig';

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

export interface IdWise {
  _id: string;
}

export interface IdVersionWise {
  _id: string;
  __v?: number;
}

export enum Fees {
  NF_SUPPORT = '15,50',
  NF_INTERMEDIATION = '0,00',
  NORTAN_SUPPORT = '15,00',
  NORTAN_INTERMEDIATION = '17,00',
}

export interface IntersectionBetweenDates {
  start: Date;
  end: Date;
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

export function omitDeep<T>(collection: T, excludeKeys: string[]): T {
  const clonedCollection = cloneDeep(collection);

  function omitFn(value: any) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      excludeKeys.forEach((key) => {
        delete value[key];
      });
    }
  }

  function traverse(value: any) {
    if (Array.isArray(value)) {
      value.forEach(traverse);
    } else if (value && typeof value === 'object') {
      omitFn(value);
      Object.keys(value).forEach((key) => traverse(value[key]));
    }
  }

  traverse(clonedCollection);
  return clonedCollection;
}

export function mockDocument(d: { documentElement: { clientWidth: number } }): void {
  doc = d;
}

export function isObjectUpdated<T extends IdVersionWise>(
  objectsList$: Observable<T[]>,
  objInfo: IdVersionWise,
  destroy$: Subject<void>,
  out$: Subject<void>
) {
  objectsList$.pipe(takeUntil(destroy$)).subscribe((objects: T[]) => {
    const mObjects = objects.filter((obj) => {
      return obj._id == objInfo._id;
    });
    if (mObjects.length == 0) {
      console.error('Objeto não encontrado!');
      return;
    }
    if (mObjects[0].__v != objInfo.__v) {
      out$.next();
    }
  });
}

export function nfPercentage(iDocument: Contract | Invoice, invoiceConfig: InvoiceConfig): string {
  const teamService = appInjector.get(TeamService);
  const invoiceService = appInjector.get(InvoiceService);

  let invoice: Invoice = new Invoice();
  if (isOfType(Invoice, iDocument)) {
    invoice = iDocument;
  } else {
    if (iDocument.receipts.length > 0) return iDocument.receipts[0].notaFiscal;
    if (iDocument.invoice) invoice = invoiceService.idToInvoice(iDocument.invoice);
  }

  if (invoice.nortanTeam) {
    const team = teamService.idToTeam(invoice.nortanTeam);
    if (invoice.type == 'nortan') {
      if (team && team.overrideSupportPercentages && team.supportOrganizationPercentage)
        return team.supportOrganizationPercentage;
    } else {
      if (team && team.overrideIntermediationPercentages && team.intermediationOrganizationPercentage)
        return team.intermediationOrganizationPercentage;
    }
  }
  return invoice.administration == 'nortan'
    ? invoiceConfig.businessFees.support.nfPercentage
    : invoiceConfig.businessFees.intermediation.nfPercentage;
}

export function nortanPercentage(iDocument: Contract | Invoice, invoiceConfig: InvoiceConfig): string {
  const teamService = appInjector.get(TeamService);
  const invoiceService = appInjector.get(InvoiceService);

  let invoice: Invoice = new Invoice();
  if (isOfType(Invoice, iDocument)) {
    invoice = iDocument;
  } else {
    if (iDocument.receipts?.length > 0) return iDocument.receipts[0].nortanPercentage;
    if (iDocument.invoice) invoice = invoiceService.idToInvoice(iDocument.invoice);
  }

  if (invoice.nortanTeam) {
    const team = teamService.idToTeam(invoice.nortanTeam);
    if (invoice.type == 'nortan') {
      if (team && team.overrideSupportPercentages && team.supportOrganizationPercentage)
        return team.supportOrganizationPercentage;
    } else {
      if (team && team.overrideIntermediationPercentages && team.intermediationOrganizationPercentage)
        return team.intermediationOrganizationPercentage;
    }
  }
  return invoice.administration == 'nortan'
    ? invoiceConfig.businessFees.support.organizationPercentage
    : invoiceConfig.businessFees.intermediation.organizationPercentage;
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
  if (!date) return '';
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

export function isOfType<T extends object>(constructor: { new (): T }, unknownObj: any): unknownObj is T {
  const genericObject = new constructor();
  const genericObjectKeys = Object.keys(genericObject).filter((key) => key != 'locals');
  const unknownObjKeys = Object.keys(unknownObj).filter((key) => key != 'locals');
  return genericObjectKeys.every((key) => unknownObjKeys.includes(key));
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
    if (
      value &&
      [
        'created',
        'date',
        'dueDate',
        'end',
        'finishedDate',
        'lastUpdate',
        'paidDate',
        'predictedDate',
        'start',
        'startDate',
      ].includes(key)
    )
      return parseISO(value);
    return value;
  }) as T;
}

export function shouldNotifyManager(
  currentResource: ContractReceipt | ContractPayment | ContractExpense,
  newResource: ContractReceipt | ContractPayment | ContractExpense
): boolean {
  return !currentResource.paid && newResource.paid;
}

export function accessNestedProperty(data: any, keys: string[], defValue = ''): any {
  const currentKey = keys.shift();
  if (!currentKey) return data;
  if (data[currentKey] === undefined || data[currentKey] === null) {
    console.error(`A propriedade ${currentKey} não existe no objeto ${data}`);
    return defValue;
  }
  return accessNestedProperty(data[currentKey], keys, defValue);
}

export function getItemsWithValue<T>(originalList: T[], key: string, value: any): T[] {
  const keys = key.split('.');
  const objs = cloneDeep(originalList);
  return objs.filter((obj: any) => {
    if (!(typeof obj[keys[0]] == 'object')) return obj[key] == value;
    if (!Array.isArray(obj[keys[0]])) return accessNestedProperty(obj, keys) == value;
    obj[keys[0]] = obj[keys[0]].filter((item: any) => {
      if (keys.length > 1) return item[keys[1]] == value;
      else return item == value;
    });
    return obj[keys[0]].length != 0;
  });
}

export function greaterAndSmallerValue<T>(object: T[], key: string = 'value'): { min: number; max: number } {
  const propertiesToAccess = key.split('.');
  const values = object.map((obj: any) => {
    return moneyToNumber(
      propertiesToAccess.length > 1 ? accessNestedProperty(obj, cloneDeep(propertiesToAccess)) : obj[key]
    );
  });
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function sortNotifications(notificationA: Notification, notificationB: Notification): number {
  const createdA = new Date(notificationA.created);
  const createdB = new Date(notificationB.created);
  return isBefore(createdA, createdB) ? 1 : -1;
}

export function handle<T extends IdWise>(data: any, oArray$: BehaviorSubject<T[]>, coll: string): void {
  if (data == new Object()) return;
  if (data.ns.coll != coll) return;
  data = reviveDates(data);
  switch (data.operationType) {
    case 'update': {
      const tmpArray = oArray$.getValue();
      const idx = tmpArray.findIndex((el: T) => el._id === data.documentKey._id);
      if (data.updateDescription.updatedFields) {
        const fieldAndIndex = Object.keys(data.updateDescription.updatedFields)[0].split('.');
        const isPush = fieldAndIndex.length > 1;
        if (isPush) {
          (tmpArray[idx] as any)[fieldAndIndex[0]].push(Object.values(data.updateDescription.updatedFields)[0]);
        } else Object.assign(tmpArray[idx], data.updateDescription.updatedFields);
      }
      if (data.updateDescription.removedFields.length > 0)
        for (const f of data.updateDescription.removedFields) delete (tmpArray[idx] as any)[f];
      oArray$.next(tmpArray);
      break;
    }

    case 'insert': {
      const tmpArray = oArray$.getValue();
      tmpArray.push(data['fullDocument']);
      oArray$.next(tmpArray);
      break;
    }

    case 'delete': {
      const tmpArray = oArray$.getValue();
      const idx = tmpArray.findIndex((el: T) => el._id === data.documentKey._id);
      if (idx != -1) {
        tmpArray.splice(idx, 1);
        oArray$.next(tmpArray);
      }
      break;
    }

    default: {
      console.log('Caso não tratado!', data);
      break;
    }
  }
}

export function getIntersectionBetweenDates(
  startDate: Date,
  endDate: Date,
  year: number
): IntersectionBetweenDates | null {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  if (startDate > endDate || startDate > endOfYear || endDate < lastDayOfMonth(startOfYear)) {
    return null;
  }
  const start = startDate > lastDayOfMonth(startOfYear) ? startDate : lastDayOfMonth(startOfYear);
  const end = endDate < endOfYear ? endDate : endOfYear;
  return { start, end };
}
