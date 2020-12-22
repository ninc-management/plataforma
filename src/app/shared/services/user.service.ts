import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { NbAuthService } from '@nebular/auth';
import { WebSocketService } from './web-socket.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take, map } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class UserService implements OnDestroy {
  private requested = false;
  private currentUser = new BehaviorSubject({});
  private destroy$ = new Subject<void>();
  private users$ = new BehaviorSubject<any[]>([]);
  currentUser$: Observable<any>;

  constructor(
    private http: HttpClient,
    private authService: NbAuthService,
    private wsService: WebSocketService,
    private socket: Socket
  ) {
    this.currentUser$ = this.currentUser.asObservable();
    this.authService
      .onTokenChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((token) => {
        if (token.getPayload())
          this.getCurrentUser(token.getPayload()['email']);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentUser(userEmail: string): void {
    this.getUsers()
      .pipe(take(2))
      .subscribe((users) => {
        const user = users.filter((user) => user.email == userEmail)[0];
        if (user != undefined) this.currentUser.next(user);
      });
  }

  getUsers(): Observable<any[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/user/all', {})
        .pipe(take(1))
        .subscribe((users: any[]) => {
          this.users$.next(
            users.sort((a, b) => {
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
        .subscribe((data) => this.wsService.handle(data, this.users$, 'users'));
    }
    return this.users$;
  }

  getUsersList(): any[] {
    return this.users$.getValue();
  }

  updateCurrentUser(currentUser: any): void {
    const body = {
      user: currentUser,
    };
    this.http.post('/api/user/update', body).pipe(take(1)).subscribe();
  }

  idToName(id: string): string {
    const tmp = this.users$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)]?.fullName;
  }

  idToUser(id: string): any {
    if (id === undefined) return undefined;
    const tmp = this.users$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }
}
