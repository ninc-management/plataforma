import { Component, OnDestroy } from '@angular/core';
import { NbIconLibraries } from '@nebular/theme';
import { combineLatest, skipWhile, Subject, takeUntil } from 'rxjs';

import { registerIcons } from 'app/shared/icon-utils';
import { CompanyService } from 'app/shared/services/company.service';
import { ConfigService } from 'app/shared/services/config.service';

import { PlatformConfig } from '@models/platformConfig';

@Component({
  selector: 'ngx-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.scss'],
})
export class NgxPublicComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  config: PlatformConfig = new PlatformConfig();
  constructor(
    private iconsLibrary: NbIconLibraries,
    private configService: ConfigService,
    public companyService: CompanyService
  ) {
    combineLatest([
      this.configService.getConfig(),
      this.companyService.getCompanies(),
      this.configService.isDataLoaded$,
      this.companyService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(([, , configLoaded, companyLoaded]) => !configLoaded || !companyLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([config, , ,]) => {
        this.config = config[0];
      });
    // NINC: change for each new client
    registerIcons(this.iconsLibrary);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
