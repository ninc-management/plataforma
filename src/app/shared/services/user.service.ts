import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { NbAuthService } from '@nebular/auth';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService implements OnDestroy {
  private currentUser = new BehaviorSubject({});
  private destroy$ = new Subject<void>();
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

  updateCurrentUser(currentUser: any): void {
    const body = {
      user: currentUser,
    };
    this.http.post('/api/user/update', body).pipe(take(1));
  }
}
