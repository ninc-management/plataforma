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
import { environment } from '../../environments/environment';

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
        this.msAuthService.instance.setActiveAccount(msg.payload.account);
      });
  }

  userEmail(): string {
    if (!!this.msAuthService.instance.getActiveAccount())
      return this.msAuthService.instance.getActiveAccount().username;
    else {
      if (this.msAuthService.instance.getAllAccounts().length > 0) {
        this.msAuthService.instance.setActiveAccount(
          this.msAuthService.instance.getAllAccounts()[0]
        );
        return this.msAuthService.instance.getActiveAccount().username;
      }
    }
    return undefined;
  }

  msLogin(): Observable<EventMessage> {
    console.log('Ambiente', environment);
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
    //TODO: Use logoutPopout() method when is merged
    // https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/3044
    this.msAuthService.logout();
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
