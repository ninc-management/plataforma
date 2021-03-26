import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from './web-socket.service';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take, map } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class ContractorService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private contractors$ = new BehaviorSubject<any[]>([]);

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private socket: Socket
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveContractor(contractor: any): void {
    const req = {
      contractor: contractor,
    };
    this.http.post('/api/contractor/', req).pipe(take(1)).subscribe();
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
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/contractor/all', {})
        .pipe(take(1))
        .subscribe((contractors: any[]) => {
          this.contractors$.next(
            contractors.sort((a, b) => {
              return a.fullName
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') <
                b.fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                ? -1
                : 1;
            })
          );
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) =>
          this.wsService.handle(data, this.contractors$, 'contractors')
        );
    }
    return this.contractors$;
  }

  idToName(id: string | 'object'): string {
    return this.idToContractor(id).fullName;
  }

  idToContractor(id: string | 'object'): any {
    if (typeof id == 'object') return id;
    if (id === undefined) return undefined;
    const tmp = this.contractors$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }
}
