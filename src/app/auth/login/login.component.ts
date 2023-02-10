import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { EventMessage, EventType } from '@azure/msal-browser';
import { NB_AUTH_OPTIONS, NbAuthService, NbLoginComponent } from '@nebular/auth';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../auth.service';

import user_validation from 'app/shared/validators/user-validation.json';

@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
})
export class NgxLoginComponent extends NbLoginComponent {
  validation = user_validation as any;
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

  logoutMicrosoft(): void {
    this.authService.msLogout();
  }

  login(): void {
    this.authService.submitted$.next(true);
    this.authService
      .msLogin()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: EventMessage) => {
        if (result.eventType === EventType.LOGIN_SUCCESS || result.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
          delete this.showMessages.error;
          delete this.showMessages.success;
          this.showMessages.success = true;
          this.myMessages = ['Acesso liberado para a plataforma.'];
          combineLatest([
            this.authService.isUserRegistred((result.payload as any).account.username),
            this.authService.isUserProspect((result.payload as any).account.username),
            this.authService.isUserActive((result.payload as any).account.username),
          ]).subscribe(([isRegistered, isProspect, isActive]) => {
            if (isRegistered != undefined && isProspect != undefined && isActive != undefined) {
              if (isRegistered) {
                if (isActive) {
                  this.authService.idToCompany((result.payload as any).account.username);
                  super.login();
                } else {
                  this.setupError('Este usuário está desativado! Por favor, entre em contato com seu líder de equipe.');
                }
              } else {
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
          this.setupError('Não foi possível autenticar em sua conta Microsoft.');
        }
      });
  }
}
