// This code was initially made by https://github.com/mfandre

import { differenceInCalendarDays, isAfter } from 'date-fns';

export class DateManipulator {
  static daysLeft(endDate: number): string {
    const today = new Date();
    if (isAfter(today, endDate)) {
      return differenceInCalendarDays(today, endDate) + ' dias atrasado';
    } else {
      return differenceInCalendarDays(endDate, today) + ' dias restantes';
    }
  }
}
