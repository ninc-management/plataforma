import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from './web-socket.service';
import { UtilsService } from './utils.service';
import { Promotion } from '../../../../backend/src/models/promotion';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';
import { parseISO } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class PromotionService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private promotions$ = new BehaviorSubject<Promotion[]>([]);

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private socket: Socket,
    private utils: UtilsService
  ) {}

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
    this.http
      .post('/api/promotion/update', req)
      .pipe(take(1))
      .subscribe(() => {
        const tmp = this.promotions$.getValue();
        tmp[tmp.findIndex((el) => el._id === promotion._id)] = promotion;
        this.promotions$.next(tmp);
      });
  }

  getPromotions(): Observable<Promotion[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/promotion/all', {})
        .pipe(take(1))
        .subscribe((promotions: any) => {
          const tmp = JSON.parse(JSON.stringify(promotions), (k, v) => {
            if (['created', 'lastUpdate', 'start', 'end'].includes(k))
              return parseISO(v);
            return v;
          });
          this.promotions$.next(tmp as Promotion[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) =>
          this.wsService.handle(data, this.promotions$, 'promotions')
        );
    }
    return this.promotions$;
  }

  idToName(id: string | Promotion): string {
    return this.idToPromotion(id).name;
  }

  idToPromotion(id: string | Promotion): Promotion {
    if (
      this.utils.isOfType<Promotion>(id, [
        '_id',
        'name',
        'start',
        'end',
        'rules',
      ])
    )
      return id;
    const tmp = this.promotions$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }
}
