import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { handle, reviveDates } from '../utils';
import { WebSocketService } from './web-socket.service';

import { Message } from '@models/message';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private requested = false;
  private messages$ = new BehaviorSubject<Message[]>([]);
  private destroy$ = new Subject<void>();
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private wsService: WebSocketService) {}

  saveMessage(message: Message): void {
    const req = {
      message: message,
    };
    this.http.post('/api/contract/createMessage/', req).pipe(take(1)).subscribe();
  }

  getMessages(): Observable<Message[]> {
    if (!this.requested) {
      this.requested = true;

      this.http
        .post('/api/contract/allMessages', {})
        .pipe(take(1))
        .subscribe((messages: any) => {
          const tmp = reviveDates(messages);
          this.messages$.next(tmp as Message[]);
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.messages$, 'messages'));
    }
    return this.messages$;
  }
}
