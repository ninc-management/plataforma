import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { handle, isOfType, reviveDates } from '../utils';
import { WebSocketService } from './web-socket.service';

import { Promotion } from '@models/promotion';

@Injectable({
  providedIn: 'root',
})
export class PromotionService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private promotions$ = new BehaviorSubject<Promotion[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }
  constructor(private http: HttpClient, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  savePromotion(promotion: Promotion): void {
    const req = {
      promotion: promotion,
    };
    this.http.post('/api/promotion/', req).pipe(take(1)).subscribe();
  }

  editPromotion(promotion: Promotion): void {
    const req = {
      promotion: promotion,
    };
    this.http.post('/api/promotion/update', req).pipe(take(1)).subscribe();
  }

  getPromotions(): Observable<Promotion[]> {
    if (!this.requested) {
      this.requested = true;

      this.http
        .post('/api/promotion/all', {})
        .pipe(take(1))
        .subscribe((promotions: any) => {
          const tmp = reviveDates(promotions);
          this.promotions$.next(tmp as Promotion[]);
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.promotions$, 'promotions'));
    }
    return this.promotions$;
  }

  idToPromotion(id: string | Promotion): Promotion {
    if (isOfType(Promotion, id)) return id;
    const tmp = this.promotions$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }
}
