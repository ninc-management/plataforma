/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { BrowserUtils } from '@azure/msal-browser';

import { AnalyticsService } from './@core/utils/analytics.service';
import { SeoService } from './@core/utils/seo.service';
import { AppUpdaterService } from './shared/services/app-updater.service';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet *ngIf="!isInPopup"></router-outlet>',
})
export class AppComponent implements OnInit {
  isInPopup = false;
  constructor(
    private analytics: AnalyticsService,
    private seoService: SeoService,
    private appUpdaterSerivce: AppUpdaterService
  ) {}

  ngOnInit() {
    this.isInPopup = BrowserUtils.isInPopup();
    this.analytics.trackPageViews();
    this.seoService.trackCanonicalChanges();
  }
}
