import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';

@Pipe({
  name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {

  transform(date: Date, divider = '/'): string {
    return format(date, 'dd' + divider + 'MM' + divider + 'yyyy');
  }

}