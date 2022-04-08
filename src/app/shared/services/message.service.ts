import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Message } from '@models/message';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { parseISO } from 'date-fns';
import { Socket } from 'ngx-socket-io';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private requested = false;
  private messages$ = new BehaviorSubject<Message[]>([]);
  private destroy$ = new Subject<void>();
  constructor(private http: HttpClient, private socket: Socket, private wsService: WebSocketService) {}

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
          const tmp = JSON.parse(JSON.stringify(messages), (k, v) => {
            if (['created'].includes(k)) return parseISO(v);
            return v;
          });
          this.messages$.next(tmp as Message[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.messages$, 'messages'));
    }
    return this.messages$;
  }
}
