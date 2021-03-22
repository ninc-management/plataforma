import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  NbLogoutComponent,
  NbAuthService,
  NB_AUTH_OPTIONS,
} from '@nebular/auth';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'ngx-logout',
  templateUrl: './logout.component.html',
})
export class NgxLogoutComponent extends NbLogoutComponent {
  constructor(
    protected service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) protected options = {},
    protected router: Router,
    private msAuthService: MsalService
  ) {
    super(service, options, router);
  }

  ngOnInit(): void {
    this.logout(this.strategy);
  }

  logout(strategy: string): void {
    super.logout(strategy);
    //TODO: Use logoutPopout() method when is merged
    // https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/3044
    this.msAuthService.logout();
  }
}
