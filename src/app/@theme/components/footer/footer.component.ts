import { Component, OnDestroy } from '@angular/core';
import { combineLatest, skipWhile, Subject, takeUntil } from 'rxjs';

import { CompanyService } from 'app/shared/services/company.service';
import { ConfigService } from 'app/shared/services/config.service';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
    <span class="created-by">
      © {{ year }} {{ companyName }}. Plataforma de gestão criada com ❤️ pela
      <a href="https://ninc.digital/" target="_blank" style="text-decoration: none;">NINC</a>
      .
    </span>
  `,
})
export class FooterComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  companyName = '';
  year = new Date().getFullYear();
  isDataLoaded = false;

  public constructor(private configService: ConfigService, private companyService: CompanyService) {
    combineLatest([this.configService.isDataLoaded$, this.configService.getConfig()])
      .pipe(
        skipWhile(([configLoaded, _]) => !configLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([_, config]) => {
        if (config[0].company) this.companyName = this.companyService.idToCompany(config[0].company).companyName;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
