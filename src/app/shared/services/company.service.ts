import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';

import { handle, isOfType, reviveDates } from '../utils';
import { WebSocketService } from './web-socket.service';

import { Company } from '@models/company';

@Injectable({
  providedIn: 'root',
})
export class CompanyService implements OnDestroy {
  private requested = false;
  private companies$ = new BehaviorSubject<Company[]>([]);
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

  getCompanies(): Observable<Company[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/company/all', {})
        .pipe(take(1))
        .subscribe((company: any) => {
          this.companies$.next(reviveDates(company) as Company[]);
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.companies$, 'companies'));
    }
    return this.companies$;
  }

  saveCompany(company: Company): void {
    const req = {
      company: company,
    };
    this.http.post('/api/company/', req).pipe(take(1)).subscribe();
  }

  idToCompany(id: string | Company): Company {
    if (isOfType(Company, id)) return id;
    const tmp = this.companies$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  editCompany(company: Company): void {
    const req = {
      company: company,
    };
    this.http.post('/api/company/update', req).pipe(take(1)).subscribe();
  }
}
