import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from './web-socket.service';
import { UtilsService } from './utils.service';
import { Contractor } from '@models/contractor';
import { Observable } from 'rxjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class ContractorService implements OnDestroy {
  private requested$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private contractors$ = new BehaviorSubject<Contractor[]>([]);

  get isDataLoaded$(): Observable<boolean> {
    return this.requested$.asObservable();
  }

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
    if (!this.requested$.getValue()) {
      this.requested$.next(true);
      this.http
        .post('/api/contractor/all', {})
        .pipe(take(1))
        .subscribe((contractors: any) => {
          this.contractors$.next(
            (contractors as Contractor[]).sort((a, b) => {
              return this.utils.nameSort(1, a.fullName, b.fullName);
            })
          );
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.contractors$, 'contractors'));
    }
    return this.contractors$;
  }

  idToContractor(id: string | Contractor): Contractor {
    if (this.utils.isOfType<Contractor>(id, ['_id', 'fullName', 'document', 'email', 'address'])) return id;
    const tmp = this.contractors$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }
}
