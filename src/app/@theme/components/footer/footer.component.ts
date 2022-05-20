import { Component, OnDestroy } from '@angular/core';
import { ConfigService } from 'app/shared/services/config.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
    <span class="created-by">
      © {{ year }} {{ companyName }}. Template criado com ❤️ por
      <a href="https://ninc.digital/" target="_blank" style="text-decoration: none;">NINC</a>
      .
    </span>
  `,
})
export class FooterComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  companyName = '';
  year = new Date().getFullYear();

  public constructor(private configService: ConfigService) {
    this.configService
      .getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe((configs) => {
        if (configs[0]) this.companyName = configs[0].socialConfig.companyName;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
