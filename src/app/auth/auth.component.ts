import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NbAuthComponent, NbAuthService } from '@nebular/auth';
import { combineLatest, skipWhile, take } from 'rxjs';

import { AuthService } from './auth.service';
import { ConfigService } from 'app/shared/services/config.service';

import { PlatformConfig } from '@models/platformConfig';

@Component({
  selector: 'ngx-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class NgxAuthComponent extends NbAuthComponent implements OnInit {
  config: PlatformConfig = new PlatformConfig();

  constructor(
    protected auth: NbAuthService,
    protected location: Location,
    public authService: AuthService,
    private configService: ConfigService
  ) {
    super(auth, location);
  }

  ngOnInit() {
    combineLatest([this.configService.isDataLoaded$, this.configService.getConfig()])
      .pipe(
        skipWhile(([configLoaded, _]) => !configLoaded),
        take(1)
      )
      .subscribe(([_, config]) => {
        this.config = config[0];
      });
  }
}
