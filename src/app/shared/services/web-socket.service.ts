import { Injectable } from '@angular/core';
import { Observable, share } from 'rxjs';
import { Manager } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  manager = new Manager('', { path: '/api/socket.io', transports: ['websocket'] });
  socket: any;
  subscribersCounter: Record<string, number> = {};
  eventObservables$: Record<string, Observable<any>> = {};
  ioSocket: any;

  constructor() {
    this.ioSocket = this.manager.socket('/');
  }

  of(namespace: string) {
    this.ioSocket.of(namespace);
  }

  on(eventName: string, callback: any) {
    this.ioSocket.on(eventName, callback);
  }

  once(eventName: string, callback: any) {
    this.ioSocket.once(eventName, callback);
  }

  connect() {
    return this.ioSocket.connect();
  }

  /* eslint-disable */
  disconnect(_close?: any) {
    return this.ioSocket.disconnect.apply(this.ioSocket, arguments);
  }

  emit(_eventName: string, ..._args: any[]) {
    return this.ioSocket.emit.apply(this.ioSocket, arguments);
  }

  removeListener(_eventName: string, _callback?: Function) {
    return this.ioSocket.removeListener.apply(this.ioSocket, arguments);
  }

  removeAllListeners(_eventName?: string) {
    return this.ioSocket.removeAllListeners.apply(this.ioSocket, arguments);
  }
  /* eslint-enable */

  fromEvent<T>(eventName: string): Observable<T> {
    if (!this.subscribersCounter[eventName]) {
      this.subscribersCounter[eventName] = 0;
    }
    this.subscribersCounter[eventName]++;

    if (!this.eventObservables$[eventName]) {
      this.eventObservables$[eventName] = new Observable((observer: any) => {
        const listener = (data: T) => {
          observer.next(data);
        };
        this.ioSocket.on(eventName, listener);
        return () => {
          this.subscribersCounter[eventName]--;
          if (this.subscribersCounter[eventName] === 0) {
            this.ioSocket.removeListener(eventName, listener);
            delete this.eventObservables$[eventName];
          }
        };
      }).pipe(share());
    }
    return this.eventObservables$[eventName];
  }

  fromOneTimeEvent<T>(eventName: string): Promise<T> {
    return new Promise<T>((resolve) => this.once(eventName, resolve));
  }
}
