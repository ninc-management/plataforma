import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';

import { handle, nameSort } from '../utils';
import { WebSocketService } from './web-socket.service';

import { Prospect } from '@models/prospect';

@Injectable({
  providedIn: 'root',
})
export class ProspectService {
  private requested = false;
  private prospects$ = new BehaviorSubject<Prospect[]>([]);
  private destroy$ = new Subject<void>();
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getProspects(): BehaviorSubject<Prospect[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/user/allProspects', {})
        .pipe(take(1))
        .subscribe((prospects: any) => {
          this.prospects$.next((prospects as Prospect[]).sort((a, b) => nameSort(1, a.name, b.name)));
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.prospects$, 'prospects'));
    }
    return this.prospects$;
  }

  approveProspect(prospect: Prospect): void {
    const reqProspect = cloneDeep(prospect);
    reqProspect.active = true;
    const req = {
      prospect: reqProspect,
    };

    this.http.delete('/api/user/approveProspect', { body: req }).pipe(take(1)).subscribe();
  }
}
