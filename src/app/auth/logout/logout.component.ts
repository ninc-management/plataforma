import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { NB_AUTH_OPTIONS, NbAuthService, NbLogoutComponent } from '@nebular/auth';

import { AuthService } from '../auth.service';

@Component({
  selector: 'ngx-logout',
  templateUrl: './logout.component.html',
})
export class NgxLogoutComponent extends NbLogoutComponent {
  constructor(
    protected service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) protected options = {},
    protected router: Router,
    private authService: AuthService
  ) {
    super(service, options, router);
  }

  ngOnInit(): void {
    this.logout(this.strategy);
  }

  logout(strategy: string): void {
    super.logout(strategy);
    this.authService.msLogout();
  }
}
