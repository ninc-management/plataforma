import { Component, DoCheck } from '@angular/core';

import { MENU_ITEMS } from './pages-menu';
import { Router } from '@angular/router';
import { NbIconLibraries } from '@nebular/theme';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent implements DoCheck {
  menu = MENU_ITEMS;

  constructor(private router: Router, iconsLibrary: NbIconLibraries) {
    iconsLibrary.registerFontPack('fa', {
      packClass: 'fa',
      iconClassPrefix: 'fa',
    });
    iconsLibrary.registerFontPack('far', {
      packClass: 'far',
      iconClassPrefix: 'fa',
    });
  }

  ngDoCheck(): void {
    for (const menu of this.menu) {
      if (menu['selected'] && menu['link'] !== this.router.url) {
        menu['selected'] = false;
      }
    }
  }
}
