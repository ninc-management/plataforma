import { Component, ChangeDetectorRef, Inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  NbLoginComponent,
  NbAuthService,
  NB_AUTH_OPTIONS,
} from '@nebular/auth';

import * as user_validation from '../../shared/user-validation.json';
import { AuthService } from '../auth.service';
import { EventMessage, EventType } from '@azure/msal-browser';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
})
export class NgxLoginComponent extends NbLoginComponent {
  validation = (user_validation as any).default;
  myMessages: string[] = [];
  myErrors: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    protected service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) protected options = {},
    protected cd: ChangeDetectorRef,
    protected router: Router,
    protected authService: AuthService
  ) {
    super(service, options, cd, router);
    this.authService.submitted$.next(false);
  }

  setupError(msg: string): void {
    this.authService.submitted$.next(false);
    delete this.showMessages.error;
    delete this.showMessages.success;
    this.showMessages.error = true;
    this.myMessages = [];
    this.myErrors = [msg];
  }

  login(): void {
    this.authService.submitted$.next(true);
    this.authService
      .msLogin()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: EventMessage) => {
        if (
          result.eventType === EventType.LOGIN_SUCCESS ||
          result.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
        ) {
          delete this.showMessages.error;
          delete this.showMessages.success;
          this.showMessages.success = true;
          this.myMessages = ['Acesso liberado para a plataforma.'];
          combineLatest([
            this.authService.isUserRegistred(
              (result.payload as any).account.username
            ),
            this.authService.isUserProspect(
              (result.payload as any).account.username
            ),
          ]).subscribe(([isRegistered, isProspect]) => {
            if (isRegistered != undefined && isProspect != undefined) {
              if (isRegistered) super.login();
              else {
                if (isProspect)
                  this.setupError(
                    'Seu cadastro ainda não foi aprovado 😅\nNão se preocupe, em breve entraremos em contato com você!'
                  );
                else this.setupError('Email não cadastrado na plataforma.');
              }
            }
          });
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
}
