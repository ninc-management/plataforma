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
    if (this.contractors$.getValue().length == 0) {
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
        .fromEvent('contractors')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => this.wsService.handle(data, this.contractors$));
    }
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
