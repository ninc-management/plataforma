import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { NbAuthService } from '@nebular/auth';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService implements OnDestroy {
  private currentUser = new BehaviorSubject({});
  private destroy$ = new Subject<void>();
  private users$ = new BehaviorSubject<any[]>([]);
  currentUser$: Observable<any>;

  constructor(private http: HttpClient, private authService: NbAuthService) {
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
    const body = {
      email: userEmail,
    };
    this.http
      .post('/api/user/', body)
      .pipe(take(1))
      .subscribe((user) => this.currentUser.next(user));
  }

  getUsers(): Observable<any[]> {
    this.http
      .post('/api/user/all', {})
      .pipe(take(1))
      .subscribe((users: any[]) => {
        this.users$.next(
          users.sort((a, b) => {
            return a.fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '') <
              b.fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              ? -1
              : 1;
          })
        );
      });
    return this.users$;
  }

  async getUsersList(): Promise<any> {
    return await this.http
      .post('/api/user/all', {})
      .pipe(
        map((users: any[]) => {
          users.map((user) => {
            return { fullName: user.fullName, _id: user._id };
          });
          users.sort((a, b) => {
            return a.fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '') <
              b.fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              ? -1
              : 1;
          });
          return users;
        })
      )
      .toPromise();
  }

  updateCurrentUser(currentUser: any): void {
    const body = {
      user: currentUser,
    };
    this.http.post('/api/user/update', body).pipe(take(1)).subscribe();
  }
}
