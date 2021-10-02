import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebSocketService } from './web-socket.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take, filter, last } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';
import { AuthService } from 'app/auth/auth.service';
import { UtilsService } from './utils.service';
import { User } from '@models/user';
import { cloneDeep } from 'lodash';

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

export const CLIENT = {
  _id: '000000000000000000000001',
  fullName: 'Cliente',
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

export const NORTAN = {
  _id: '000000000000000000000002',
  fullName: 'Nortan',
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
  private isLoaded = false;
  private _currentUser$ = new BehaviorSubject<User>(new User());
  private destroy$ = new Subject<void>();
  private users$ = new BehaviorSubject<User[]>([]);

  get currentUser$(): Observable<User> {
    if (this._currentUser$.value._id == undefined) {
      this.refreshCurrentUser();
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
    this.authService.onUserChange$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshCurrentUser();
    });
    this.refreshCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshCurrentUser(): void {
    const email = this.authService.userEmail();
    if (email) {
      this.getUser(email)
        .pipe(
          take(2),
          filter((user): user is User => user !== undefined)
        )
        .subscribe((user) => this._currentUser$.next(cloneDeep(user)));
    }
  }

  getUser(userEmail: string): BehaviorSubject<User | undefined> {
    const user$ = new BehaviorSubject<User | undefined>(undefined);
    this.getUsers()
      .pipe(take(this.isLoaded ? 1 : 2), last())
      .subscribe((users) => {
        const matchedUsers = users.filter((user) => user.email == userEmail);
        if (matchedUsers.length > 0) user$.next(cloneDeep(matchedUsers[0]));
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
        .subscribe((users: any) => {
          this.users$.next(
            (users as User[]).sort((a, b) => {
              this.isLoaded = true;
              return this.utils.nameSort(1, a.fullName, b.fullName);
            })
          );
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.users$, 'users'));
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
          this._currentUser$.next(cloneDeep(user));
          if (callback !== undefined) {
            setTimeout(callback, 100);
          }
        }
      });
  }

  idToName(id: string | User | undefined): string {
    if (id === undefined) return '';
    return this.idToUser(id)?.fullName;
  }

  idToShortName(id: string | User): string {
    const exibitionName = this.idToUser(id).exibitionName;
    if (exibitionName) return exibitionName;
    return this.idToUser(id).fullName;
  }

  idToProfilePicture(id: string | User | undefined): string {
    if (id === undefined) return '';
    const pP = this.idToUser(id).profilePicture;
    return pP ? pP : '';
  }

  idToUser(id: string | User): User {
    if (this.utils.isOfType<User>(id, ['_id', 'fullName', 'email', 'phone'])) return id;
    if (id == CONTRACT_BALANCE._id) return CONTRACT_BALANCE as User;
    if (id == CLIENT._id) return CLIENT as User;
    if (id == NORTAN._id) return NORTAN as User;
    const tmp = this.users$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  profilePicture(uId: string | User | undefined): string {
    if (uId === undefined) return '';
    const author = this.idToUser(uId);
    if (author.profilePicture === undefined) return '';
    return author.profilePicture;
  }

  isEqual(u1: string | User | undefined, u2: string | User | undefined): boolean {
    if (u1 == undefined || u2 == undefined) return false;
    return this.idToUser(u1)._id == this.idToUser(u2)._id;
  }
}
