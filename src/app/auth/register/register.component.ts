import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import {
  NbRegisterComponent,
  NbAuthService,
  NB_AUTH_OPTIONS,
} from '@nebular/auth';

import * as user_validation from '../../shared/user-validation.json';
import { StatecityService } from '../../shared/services/statecity.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { EventMessage, EventType } from '@azure/msal-browser';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'ngx-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class NgxRegisterComponent
  extends NbRegisterComponent
  implements OnInit {
  cities: string[] = [];
  states: string[] = [];
  myMessages: string[] = [];
  myErrors: string[] = [];
  validation = (user_validation as any).default;
  protected destroy$ = new Subject<void>();

  constructor(
    private statecityService: StatecityService,
    private authService: AuthService,
    protected service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) protected options = {},
    protected cd: ChangeDetectorRef,
    protected router: Router,
    public utils: UtilsService
  ) {
    super(service, options, cd, router);
  }

  ngOnInit() {
    this.states = this.statecityService.buildStateList();
    this.authService.submitted$.next(false);

    this.authService
      .msLogin()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: EventMessage) => {
        if (
          result.eventType === EventType.LOGIN_SUCCESS ||
          result.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
        ) {
          this.user.email = (result.payload as any).account.username;
        } else if (
          result.eventType === EventType.LOGIN_FAILURE ||
          result.eventType === EventType.ACQUIRE_TOKEN_FAILURE
        ) {
          this.setupError(
            'Não foi possível autenticar em sua conta Microsoft.'
          );
        }
      });
  }

  swicthAccount(): void {
    this.authService.msLogout();
  }

  setupError(msg: string): void {
    this.authService.submitted$.next(false);
    delete this.showMessages.error;
    delete this.showMessages.success;
    this.showMessages.error = true;
    this.myMessages = [];
    this.myErrors = [msg];
  }

  setupMessage(msg: string): void {
    this.authService.submitted$.next(false);
    delete this.showMessages.error;
    delete this.showMessages.success;
    this.showMessages.success = true;
    this.myMessages = [msg];
    this.myErrors = [];
  }

  register(): void {
    this.gotoTop();
    this.authService.submitted$.next(true);
    this.authService.register(this.user).subscribe((res) => {
      if (res.message) {
        this.setupMessage(res.message);
      }
      if (res.error) this.setupError(res.error);
    });
  }

  regexSanatizer(regex: string): string {
    return regex.replace(/[\\\^\$\.\|\?\*\+\(\)\[\{]/g, (el) => '\\' + el);
  }

  buildCityList(state: string): void {
    this.user.city = undefined;
    this.cities = this.statecityService.buildCityList(state);
  }

  gotoTop(): void {
    document.querySelector('#cardBody').scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
