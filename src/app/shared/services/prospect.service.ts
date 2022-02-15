import { Injectable } from '@angular/core';
import { Prospect } from '@models/prospect';
import { BehaviorSubject, Subject, take, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from './utils.service';
import { Socket } from 'ngx-socket-io';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class ProspectService {
  private prospects$ = new BehaviorSubject<Prospect[]>([]);
  private destroy$ = new Subject<void>();

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
    this.http
      .post('/api/user/allProspects', {})
      .pipe(take(1))
      .subscribe((prospects: any) => {
        this.prospects$.next((prospects as Prospect[]).sort((a, b) => this.utils.nameSort(1, a.fullName, b.fullName)));
      });
    this.socket
      .fromEvent('dbchange')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => this.wsService.handle(data, this.prospects$, 'prospects'));
    return this.prospects$;
  }
}
