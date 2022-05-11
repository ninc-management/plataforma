import { Injectable } from '@angular/core';
import { Prospect } from '@models/prospect';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from './utils.service';
import { Socket } from 'ngx-socket-io';
import { WebSocketService } from './web-socket.service';
import { cloneDeep } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class ProspectService {
  private requested$ = new BehaviorSubject<boolean>(false);
  private prospects$ = new BehaviorSubject<Prospect[]>([]);
  private destroy$ = new Subject<void>();

  get isDataLoaded$(): Observable<boolean> {
    return this.requested$.asObservable();
  }

  constructor(
    private http: HttpClient,
    private utils: UtilsService,
    private socket: Socket,
    private wsService: WebSocketService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getProspects(): BehaviorSubject<Prospect[]> {
    if (!this.requested$.getValue()) {
      this.requested$.next(true);
      this.http
        .post('/api/user/allProspects', {})
        .pipe(take(1))
        .subscribe((prospects: any) => {
          this.prospects$.next(
            (prospects as Prospect[]).sort((a, b) => this.utils.nameSort(1, a.fullName, b.fullName))
          );
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.prospects$, 'prospects'));
    }
    return this.prospects$;
  }

  approveProspect(prospect: Prospect): void {
    const reqProspect = cloneDeep(prospect);
    reqProspect.active = true;
    const req = {
      prospect: reqProspect,
    };

    this.http.delete('/api/user/approveProspect', { body: req }).pipe(take(1)).subscribe();
  }
}
