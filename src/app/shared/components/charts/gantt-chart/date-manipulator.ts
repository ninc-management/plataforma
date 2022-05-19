// This code was initially made by https://github.com/mfandre

import { Contract } from '@models/contract';
import { differenceInCalendarDays, isAfter, isBefore } from 'date-fns';
import { TaskModel } from './task-data.model';

export function daysLeft(endDate: number): string {
  const today = new Date();
  if (isAfter(today, endDate)) {
    return differenceInCalendarDays(today, endDate) + ' dias atrasado';
  } else {
    return differenceInCalendarDays(endDate, today) + ' dias restantes';
  }
}
export function getMinDate(taskData: TaskModel[], contract: Contract): Date {
  const tasksMinDate = taskData.reduce((minDate, item) => {
    if (item.start < minDate) minDate = item.start;
    return minDate;
  }, new Date(8640000000000000));

  if (isBefore(tasksMinDate, contract.created)) return tasksMinDate;
  return new Date(contract.created);
}
