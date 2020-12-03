import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  constructor() {}

  handle(data: any, oArray$: BehaviorSubject<any[]>): void {
    if (data == {}) return;
    switch (data.operationType) {
      case 'update': {
        let tmpArray = oArray$.getValue();
        let idx = tmpArray.findIndex((el) => el._id === data.documentKey._id);
        if (data.updateDescription.updatedFields)
          tmpArray[idx] = Object.assign(
            tmpArray[idx],
            data.updateDescription.updatedFields
          );
        if (data.updateDescription.removedFields.length > 0)
          for (const f of data.updateDescription.removedFields)
            delete tmpArray[idx][f];
        oArray$.next(tmpArray);
        break;
      }

      case 'insert': {
        let tmpArray = oArray$.getValue();
        tmpArray.push(data.fullDocument);
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
