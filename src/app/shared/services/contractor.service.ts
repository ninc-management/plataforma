import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { NbAuthService } from '@nebular/auth';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ContractorService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private contractors$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient, private authService: NbAuthService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveContractor(contractor: any): void {
    const req = {
      contractor: contractor,
    };
    this.http
      .post('/api/contractor/', req)
      .pipe(take(1))
      .subscribe((res: any) => {
        let tmp = this.contractors$.getValue();
        tmp.push(res.contractor);
        this.contractors$.next(tmp);
      });
  }

  editContractor(contractor: any): void {
    const req = {
      contractor: contractor,
    };
    this.http
      .post('/api/contractor/update', req)
      .pipe(take(1))
      .subscribe(() => {
        let tmp = this.contractors$.getValue();
        tmp[tmp.findIndex((el) => el._id === contractor._id)] = contractor;
        this.contractors$.next(tmp);
      });
  }

  getContractors(): Observable<any[]> {
    this.http
      .post('/api/contractor/all', {})
      .pipe(take(1))
      .subscribe((contractors: any[]) => {
        this.contractors$.next(contractors);
      });
    return this.contractors$;
  }

  idToName(id: string): string {
    const tmp = this.contractors$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)]?.fullName;
  }

  idToContractor(id: string): any {
    if (id === undefined) return undefined;
    const tmp = this.contractors$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }
}
