import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { handle, isOfType, nameSort } from '../utils';
import { WebSocketService } from './web-socket.service';

import { Contractor } from '@models/contractor';

@Injectable({
  providedIn: 'root',
})
export class ContractorService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private contractors$ = new BehaviorSubject<Contractor[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveContractor(contractor: Contractor): void {
    const req = {
      contractor: contractor,
    };
    this.http.post('/api/contractor/', req).pipe(take(1)).subscribe();
  }

  editContractor(contractor: Contractor): void {
    const req = {
      contractor: contractor,
    };
    this.http.post('/api/contractor/update', req).pipe(take(1)).subscribe();
  }

  getContractors(): Observable<Contractor[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/contractor/all', {})
        .pipe(take(1))
        .subscribe((contractors: any) => {
          this.contractors$.next(
            (contractors as Contractor[]).sort((a, b) => {
              return nameSort(1, a.name, b.name);
            })
          );
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.contractors$, 'contractors'));
    }
    return this.contractors$;
  }

  idToContractor(id: string | Contractor): Contractor {
    if (isOfType(Contractor, id)) return id;
    const tmp = this.contractors$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }
}
