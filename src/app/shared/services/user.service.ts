import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { cloneDeep } from 'lodash';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { last, skipWhile, take, takeUntil } from 'rxjs/operators';

import { isOfType, nameSort, reviveDates } from '../utils';
import { WebSocketService } from './web-socket.service';
import { AuthService } from 'app/auth/auth.service';

import { InvoiceTeamMember } from '@models/invoice';
import { TeamMember } from '@models/team';
import { User } from '@models/user';

// NINC: change for each new client
const supportProfilePicture =
  'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/profileImages%2F5f1877da7ba3173ce285d916?alt=media&token=c026b3e7-3762-4b8b-a2ed-ade02fce5a0a';
export const CONTRACT_BALANCE = {
  _id: '000000000000000000000000',
  fullName: 'Caixa do contrato',
  email: '',
  professionalEmail: '',
  phone: '',
  article: '',
  state: '',
  city: '',
  level: '',
  theme: 'default',
  document: '',
  position: ['Associado'],
  sectors: [],
  expertise: [],
  AER: [],
  transactions: [],
  notifications: [],
  active: true,
  profilePicture: supportProfilePicture,
} as User;

export const CLIENT = {
  _id: '000000000000000000000001',
  fullName: 'Cliente',
  email: '',
  professionalEmail: '',
  phone: '',
  article: '',
  state: '',
  city: '',
  level: '',
  theme: 'default',
  document: '',
  position: ['Associado'],
  sectors: [],
  expertise: [],
  AER: [],
  transactions: [],
  notifications: [],
  active: true,
  profilePicture: supportProfilePicture,
} as User;

// NINC: change fullName for each new client
export const NORTAN = {
  _id: '000000000000000000000002',
  fullName: 'Nortan',
  email: '',
  professionalEmail: '',
  phone: '',
  article: '',
  state: '',
  city: '',
  level: '',
  theme: 'default',
  document: '',
  position: ['Associado'],
  sectors: [],
  expertise: [],
  AER: [],
  transactions: [],
  notifications: [],
  active: true,
  profilePicture: supportProfilePicture,
} as User;

@Injectable({
  providedIn: 'root',
})
export class UserService implements OnDestroy {
  private requested = false;
  private _currentUser$ = new BehaviorSubject<User>(new User());
  private destroy$ = new Subject<void>();
  private users$ = new BehaviorSubject<User[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get currentUser$(): Observable<User> {
    if (this._currentUser$.value._id == undefined) {
      this.refreshCurrentUser();
    }
    return this._currentUser$;
  }

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private wsService: WebSocketService,
    private socket: Socket
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
          skipWhile((user) => user === undefined),
          take(1)
        )
        .subscribe((user) => {
          if (user) this._currentUser$.next(cloneDeep(user));
        });
    }
  }

  getUser(userEmail: string): BehaviorSubject<User | undefined> {
    const user$ = new BehaviorSubject<User | undefined>(undefined);
    this.getUsers()
      .pipe(take(this._isDataLoaded$.getValue() ? 1 : 2), last())
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
          const tmp = reviveDates(users);
          this.users$.next(
            (tmp as User[]).sort((a, b) => {
              return nameSort(1, a.fullName, b.fullName);
            })
          );
          this._isDataLoaded$.next(true);
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

  idToShortName(id: string | User): string {
    const exibitionName = this.idToUser(id).exibitionName;
    if (exibitionName) return exibitionName;
    return this.idToUser(id).fullName;
  }

  idToUser(id: string | User): User {
    if (isOfType<User>(id, ['_id', 'fullName', 'email', 'phone'])) return id;
    if (id == CONTRACT_BALANCE._id) return CONTRACT_BALANCE as User;
    if (id == CLIENT._id) return CLIENT as User;
    if (id == NORTAN._id) return NORTAN as User;
    const tmp = this.users$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  isEqual(u1: string | User | undefined, u2: string | User | undefined): boolean {
    if (u1 == undefined || u2 == undefined) return false;
    return this.idToUser(u1)._id == this.idToUser(u2)._id;
  }

  isUserInTeam(
    u1: string | User | undefined,
    team: InvoiceTeamMember[] | TeamMember[] | (User | string | undefined)[] //AER
  ): boolean {
    if (u1 == undefined) return false;
    return team.some((member: InvoiceTeamMember | TeamMember | User | string | undefined) => {
      if (isOfType<InvoiceTeamMember>(member, ['user', 'distribution']) || isOfType<TeamMember>(member, ['user'])) {
        return this.isEqual(u1, member.user);
      }
      return this.isEqual(u1, member);
    });
  }
}
