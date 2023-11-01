import { Component, ElementRef, ViewChild } from '@angular/core';
import { environment } from 'app/../environments/environment';

@Component({
  selector: 'ngx-one-column-layout',
  styleUrls: ['./one-column.layout.scss'],
  template: `
    <nb-layout windowMode>
      <nb-layout-header
        fixed
        [ngStyle]="{
          'background-color': headerColor()
        }"
      >
        <ngx-header></ngx-header>
      </nb-layout-header>

      <nb-sidebar
        class="menu-sidebar"
        tag="menu-sidebar"
        responsive
        start
        [compactedBreakpoints]="['xs', 'is', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']"
        #sidebar
      >
        <ng-content select="[slot=main]"></ng-content>
        <div>
          <ng-content select="[slot=social]"></ng-content>
          <ng-content select="[slot=pwa]"></ng-content>
        </div>
      </nb-sidebar>

      <nb-layout-column>
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>

      <nb-layout-footer fixed>
        <ngx-footer></ngx-footer>
      </nb-layout-footer>
    </nb-layout>
  `,
})
export class OneColumnLayoutComponent {
  @ViewChild('sidebar', { static: false, read: ElementRef })
  sidebarRef!: ElementRef<HTMLElement>;

  headerColor(): string {
    return environment.demo != undefined ? 'var(--alert-accent-danger-color)' : 'var(--header-background-color)';
  }
}
