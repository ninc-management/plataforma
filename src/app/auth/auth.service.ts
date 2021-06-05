import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
  MsalService,
  MsalBroadcastService,
} from '@azure/msal-angular';
import { filter, take, map, takeUntil } from 'rxjs/operators';
import { EventMessage, EventType, PopupRequest } from '@azure/msal-browser';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  submitted$ = new BehaviorSubject<boolean>(false);
  onUserChange$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private http: HttpClient,
    private msAuthService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) {
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.LOGOUT_SUCCESS ||
            msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((msg: EventMessage) => {
        this.onUserChange$.next();
        this.msAuthService.instance.setActiveAccount(
          (msg.payload as any).account
        );
      });
  }

  userEmail(): string | undefined {
    let acc = this.msAuthService.instance.getActiveAccount();
    if (acc) return acc.username;
    else {
      if (this.msAuthService.instance.getAllAccounts().length > 0) {
        this.msAuthService.instance.setActiveAccount(
          this.msAuthService.instance.getAllAccounts()[0]
        );
        acc = this.msAuthService.instance.getActiveAccount();
        if (acc) return acc.username;
      }
    }
    return undefined;
  }

  msLogin(): Observable<EventMessage> {
    this.msAuthService
      .loginPopup({ ...this.msalGuardConfig.authRequest } as PopupRequest)
      .subscribe();

    return this.msalBroadcastService.msalSubject$.pipe(
      filter(
        (msg: EventMessage) =>
          msg.eventType === EventType.LOGIN_SUCCESS ||
          msg.eventType === EventType.LOGIN_FAILURE ||
          msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
          msg.eventType === EventType.ACQUIRE_TOKEN_FAILURE
      )
    );
  }

  msLogout(): void {
    this.msAuthService.logoutPopup({
      ...this.msalGuardConfig.authRequest,
    } as PopupRequest);
  }

  register(prospect: any): Observable<any> {
    return this.http.post('/api/auth/register', prospect).pipe(take(1));
  }

  isUserRegistred(email: string): Observable<boolean> {
    const body = {
      email: email,
    };
    return this.http.post('/api/auth/isRegistered', body).pipe(
      take(1),
      map((res) => (res as any).isRegistered)
    );
  }

  isUserProspect(email: string): Observable<boolean> {
    const body = {
      email: email,
    };
    return this.http.post('/api/auth/isProspect', body).pipe(
      take(1),
      map((res) => (res as any).isRegistered)
    );
  }
}
