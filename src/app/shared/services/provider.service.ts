import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';

import { handle, isOfType, nameSort } from '../utils';
import { WebSocketService } from './web-socket.service';

import { Provider } from '@models/provider';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  private requested = false;
  private destroy$ = new Subject<void>();
  private providers$ = new BehaviorSubject<Provider[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveProvider(provider: Provider): void {
    const req = {
      provider: provider,
    };
    this.http.post('/api/provider/', req).pipe(take(1)).subscribe();
  }

  editProvider(provider: Provider): void {
    const req = {
      provider: provider,
    };
    this.http.post('/api/provider/update', req).pipe(take(1)).subscribe();
  }

  getProviders(): Observable<Provider[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/provider/all', {})
        .pipe(take(1))
        .subscribe((providers: any) => {
          this.providers$.next(
            (providers as Provider[]).sort((a, b) => {
              return nameSort(1, a.fullName, b.fullName);
            })
          );
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.providers$, 'providers'));
    }
    return this.providers$;
  }

  idToProvider(id: string | Provider): Provider {
    if (isOfType(Provider, id)) return id;
    const tmp = this.providers$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  isEqual(p1: string | Provider | undefined, p2: string | Provider | undefined): boolean {
    if (p1 == undefined || p2 == undefined) return false;
    return this.idToProvider(p1)._id == this.idToProvider(p2)._id;
  }

  isProviderInList(
    provider: string | Provider | undefined,
    list: (Provider | string | undefined)[] //AER
  ): boolean {
    if (provider == undefined) return false;
    return list.some((p: Provider | string | undefined) => this.isEqual(provider, p));
  }
}
