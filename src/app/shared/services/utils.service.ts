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

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(private breakpointService: NbMediaBreakpointsService) {}

  isPhone(): boolean {
    const { sm } = this.breakpointService.getBreakpointsMap();
    return document.documentElement.clientWidth <= sm;
  }

  nfPercentage(contract: 'object'): string {
    if (contract['invoice'].administration == 'nortan') {
      if (contract['invoice'].department == 'DEC') {
        return '8,5';
      } else {
        return '15,5';
      }
    } else {
      return '0';
    }
  }

  nortanPercentage(contract: 'object'): string {
    if (contract['invoice'].administration == 'nortan') return '15';
    return '17';
  }

  // https://stackoverflow.com/a/42488360
  sumObjectsByKey(...objs: any): any {
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
