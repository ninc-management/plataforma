import { Component, OnDestroy } from '@angular/core';
import { ConfigService } from 'app/shared/services/config.service';
import { combineLatest, skipWhile, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
    <span class="created-by">
      © {{ year }} {{ companyName }}. Plataforma de gestão criada com ❤️
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

  public constructor(private configService: ConfigService) {
    combineLatest([this.configService.isDataLoaded$, this.configService.getConfig()])
      .pipe(
        skipWhile(([configLoaded, config]) => !configLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([configLoaded, config]) => {
        this.companyName = config[0].socialConfig.companyName;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
