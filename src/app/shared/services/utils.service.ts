import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  // https://stackoverflow.com/a/42488360
  sumObjectsByKey(...objs: any): any {
    return objs.reduce((a, b) => {
      for (const k in b) {
        if (b.hasOwnProperty(k)) a[k] = (a[k] || 0) + b[k];
      }
      return a;
    }, {});
  }

  deepCopy(obj: any): any {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || 'object' != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.deepCopy(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = this.deepCopy(obj[attr]);
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  compareDates(
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
}
