import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { WebSocketService } from './web-socket.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take, filter } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';
import { AuthService } from 'app/auth/auth.service';
import { UtilsService } from './utils.service';
import { User } from '../../../../backend/src/models/user';

export const CONTRACT_BALANCE = {
  _id: '000000000000000000000000',
  fullName: 'Caixa do contrato',
  email: '',
  emailNortan: '',
  phone: '',
  article: '',
  state: '',
  city: '',
  mainDepartment: '',
  level: '',
  document: '',
  profilePicture:
    'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/profileImages%2F5f1877da7ba3173ce285d916?alt=media&token=c026b3e7-3762-4b8b-a2ed-ade02fce5a0a',
} as User;

@Injectable({
  providedIn: 'root',
})
export class UserService implements OnDestroy {
  private requested = false;
  private _currentUser$ = new BehaviorSubject<User>(undefined);
  private destroy$ = new Subject<void>();
  private users$ = new BehaviorSubject<User[]>([]);

  get currentUser$(): Observable<User> {
    if (this._currentUser$.value?.fullName == undefined) {
      this.getCurrentUser();
    }
    return this._currentUser$;
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private wsService: WebSocketService,
    private socket: Socket,
    private utils: UtilsService
  ) {
    this.authService.onUserChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getCurrentUser();
      });
    this.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentUser(): void {
    const email = this.authService.userEmail();
    if (email) {
      this.getUser(email)
        .pipe(
          take(2),
          filter((user) => user !== undefined)
        )
        .subscribe((user) => this._currentUser$.next(user));
    }
  }

  getUser(userEmail: string): BehaviorSubject<User> {
    let user$ = new BehaviorSubject<User>(undefined);
    this.getUsers()
      .pipe(take(2))
      .subscribe((users) => {
        const user = users.filter((user) => user.email == userEmail)[0];
        if (user != undefined) user$.next(user);
        else user$.next(undefined);
      });
    return user$;
  }

  getUsers(): BehaviorSubject<User[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/user/all', {})
        .pipe(take(1))
        .subscribe((users: User[]) => {
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

  getUsersList(): User[] {
    return this.users$.getValue();
  }

  updateUser(user: User, callback?: () => void, isCurrentUser = false): void {
    const body = {
      user: user,
    };
    this.http
      .post('/api/user/update', body)
      .pipe(take(1))
      .subscribe(() => {
        if (isCurrentUser) {
          this._currentUser$.next(user);
          if (callback) callback();
        }
      });
  }

  idToName(id: string | User): string {
    return this.idToUser(id).fullName;
  }

  idToShortName(id: string | User): string {
    return this.idToUser(id)?.exibitionName
      ? this.idToUser(id).exibitionName
      : this.idToUser(id).fullName;
  }

  idToUser(id: string | User): User {
    if (this.utils.isIdOrType<User>(id)) return id;
    if (id === undefined) return undefined;
    if (id == CONTRACT_BALANCE._id) return CONTRACT_BALANCE as User;
    const tmp = this.users$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }
}
