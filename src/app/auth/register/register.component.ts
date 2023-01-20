import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventMessage, EventType } from '@azure/msal-browser';
import { NB_AUTH_OPTIONS, NbAuthService, NbRegisterComponent } from '@nebular/auth';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { AuthService } from '../auth.service';
import { CompanyService } from 'app/shared/services/company.service';
import { StatecityService } from 'app/shared/services/statecity.service';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

import { Prospect } from '@models/prospect';

import user_validation from 'app/shared/validators/user-validation.json';

@Component({
  selector: 'ngx-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class NgxRegisterComponent extends NbRegisterComponent implements OnInit {
  cities: string[] = [];
  states: string[] = [];
  myMessages: string[] = [];
  myErrors: string[] = [];
  validation = user_validation as any;
  prospect = new Prospect();
  protected destroy$ = new Subject<void>();
  companyName: string = '';
  companyId: string = '635c66ce53ede7bbfa237278';

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    private statecityService: StatecityService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private companyService: CompanyService,
    protected service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) protected options = {},
    protected cd: ChangeDetectorRef,
    protected router: Router
  ) {
    super(service, options, cd, router);
  }

  ngOnInit() {
    this.states = this.statecityService.buildStateList();
    this.authService.submitted$.next(false);
    this.companyService
      .getCompanies()
      .pipe(take(2))
      .subscribe(() => {
        this.route.queryParams.subscribe((params) => {
          if (params.companyId) {
            const company = this.companyService.idToCompany(params.companyId);
            if (company) {
              this.companyName = company.companyName;
            } else this.companyName = 'Versão de teste';
            this.prospect.company = company._id;
          } else {
            this.companyName = 'Versão de teste';
            this.prospect.company = '000000000000000000000000';
          }
        });
      });
  }

  ngAfterViewInit() {
    this.authService
      .msLogin()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: EventMessage) => {
        if (result.eventType === EventType.LOGIN_SUCCESS || result.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
          this.prospect.email = (result.payload as any).account.username;
        } else if (
          result.eventType === EventType.LOGIN_FAILURE ||
          result.eventType === EventType.ACQUIRE_TOKEN_FAILURE
        ) {
          this.setupError('Não foi possível autenticar em sua conta Microsoft.');
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
    this.authService.register(this.prospect).subscribe((res) => {
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
    const cardBody = document.querySelector('#cardBody');
    if (cardBody)
      cardBody.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
  }
}
