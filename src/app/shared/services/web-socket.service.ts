import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UtilsService } from './utils.service';
import { parseISO } from 'date-fns';

interface IdWise {
  _id: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  constructor(private utils: UtilsService) {}

  handle<T extends IdWise>(
    data: any,
    oArray$: BehaviorSubject<T[]>,
    coll: string
  ): void {
    if (data == new Object()) return;
    if (data.ns.coll != coll) return;
    data = JSON.parse(JSON.stringify(data), (k, v) => {
      if (['created', 'lastUpdate', 'paidDate'].includes(k)) return parseISO(v);
      return v;
    });
    switch (data.operationType) {
      case 'update': {
        const tmpArray = oArray$.getValue();
        const idx = tmpArray.findIndex(
          (el: T) => el._id === data.documentKey._id
        );
        if (data.updateDescription.updatedFields)
          tmpArray[idx] = Object.assign(
            tmpArray[idx],
            data.updateDescription.updatedFields
          );
        if (data.updateDescription.removedFields.length > 0)
          for (const f of data.updateDescription.removedFields)
            delete (tmpArray[idx] as any)[f];
        oArray$.next(tmpArray);
        break;
      }

      case 'insert': {
        const tmpArray = oArray$.getValue();
        tmpArray.push(data['fullDocument']);
        oArray$.next(tmpArray);
        break;
      }

      default: {
        console.log('Caso não tratado!', data);
        break;
      }
    }
  }
}
