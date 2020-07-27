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

@Component({
  selector: 'ngx-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class NgxRegisterComponent extends NbRegisterComponent
  implements OnInit {
  cities: string[] = [];
  states: string[] = [];
  validation = (user_validation as any).default;

  constructor(
    private statecityService: StatecityService,
    protected service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) protected options = {},
    protected cd: ChangeDetectorRef,
    protected router: Router,
    protected authService: AuthService
  ) {
    super(service, options, cd, router);
  }

  ngOnInit() {
    this.states = this.statecityService.buildStateList();
    this.authService.submitted$.next(false);
  }

  register(): void {
    // Remove existing token before register a new one
    this.service.logout('email');
    localStorage.clear();
    this.authService.submitted$.next(true);

    super.register();
  }

  regexSanatizer(regex: string): string {
    return regex.replace(/[\\\^\$\.\|\?\*\+\(\)\[\{]/g, (el) => '\\' + el);
  }

  buildCityList(state: string): void {
    this.user.city = undefined;
    this.cities = this.statecityService.buildCityList(state);
  }
}
