import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { PlatformConfig } from '@models/platformConfig';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private config$ = new BehaviorSubject<PlatformConfig[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private socket: Socket, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveConfig(config: PlatformConfig): void {
    const req = {
      config: config,
    };
    this.http.post('/api/config/', req).pipe(take(1)).subscribe();
  }

  //INVARIANT: There's only one PlatformConfig object in the collection
  getConfig(): Observable<PlatformConfig[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/config/all', {})
        .pipe(take(1))
        .subscribe((config: any) => {
          this.config$.next(config as PlatformConfig[]);
          this._isDataLoaded$.next(true);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.config$, 'platformconfigs'));
    }
    return this.config$;
  }

  editConfig(config: PlatformConfig): void {
    const req = {
      config: config,
    };
    this.http.post('/api/config/update', req).pipe(take(1)).subscribe();
  }

  expenseSubTypes(type: string): string[] {
    if (!type) return [];
    const tmpType = this.config$.value[0].expenseTypes.find((eType) => eType.name === type);
    return tmpType ? tmpType.subTypes : [];
  }
}
