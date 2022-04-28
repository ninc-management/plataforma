import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UtilsService } from './utils.service';

interface IdWise {
  _id: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  constructor(private utils: UtilsService) {}

  handle<T extends IdWise>(data: any, oArray$: BehaviorSubject<T[]>, coll: string): void {
    if (data == new Object()) return;
    if (data.ns.coll != coll) return;
    data = this.utils.reviveDates(data);
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
}
