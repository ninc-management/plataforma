import {
  Component,
  DoCheck,
  AfterViewInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { MENU_ITEMS } from './pages-menu';
import { Router } from '@angular/router';
import {
  NbIconLibraries,
  NbSidebarService,
  NbMenuService,
} from '@nebular/theme';
import { LayoutService } from '../@core/utils';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { OneColumnLayoutComponent } from '../@theme/layouts';

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
export class PagesComponent implements OnDestroy, DoCheck, AfterViewInit {
  private destroy$ = new Subject<void>();
  @ViewChild(OneColumnLayoutComponent, { static: false })
  private layout: OneColumnLayoutComponent;
  menu = MENU_ITEMS;

  constructor(
    private router: Router,
    private iconsLibrary: NbIconLibraries,
    private layoutService: LayoutService,
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService
  ) {
    iconsLibrary.registerFontPack('fa', {
      packClass: 'fa',
      iconClassPrefix: 'fa',
    });
    iconsLibrary.registerFontPack('far', {
      packClass: 'far',
      iconClassPrefix: 'fa',
    });
    iconsLibrary.registerSvgPack('fac', {
      receipt:
        '<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="top: -2px; position: relative"><path fill="currentColor" d="M344 240H104c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h240c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8zm0 96H104c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h240c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8zM418.1 0c-5.8 0-11.8 1.8-17.3 5.7L357.3 37 318.7 9.2c-8.4-6-18.2-9.1-28.1-9.1-9.8 0-19.6 3-28 9.1L224 37 185.4 9.2C177 3.2 167.1.1 157.3.1s-19.6 3-28 9.1L90.7 37 47.2 5.7C41.8 1.8 35.8 0 29.9 0 14.4.1 0 12.3 0 29.9v452.3C0 499.5 14.3 512 29.9 512c5.8 0 11.8-1.8 17.3-5.7L90.7 475l38.6 27.8c8.4 6 18.2 9.1 28.1 9.1 9.8 0 19.6-3 28-9.1L224 475l38.6 27.8c8.4 6 18.3 9.1 28.1 9.1s19.6-3 28-9.1l38.6-27.8 43.5 31.3c5.4 3.9 11.4 5.7 17.3 5.7 15.5 0 29.8-12.2 29.8-29.8V29.9C448 12.5 433.7 0 418.1 0zM416 477.8L376 449l-18.7-13.5-18.7 13.5-38.6 27.8c-2.8 2-6 3-9.3 3-3.4 0-6.6-1.1-9.4-3.1L242.7 449 224 435.5 205.3 449l-38.6 27.8c-2.8 2-6 3-9.4 3-3.4 0-6.6-1.1-9.4-3.1L109.3 449l-18.7-13.5L72 449l-40 29.4V34.2L72 63l18.7 13.5L109.4 63 148 35.2c2.8-2 6-3 9.3-3 3.4 0 6.6 1.1 9.4 3.1L205.3 63 224 76.5 242.7 63l38.6-27.8c2.8-2 6-3 9.4-3 3.4 0 6.6 1.1 9.4 3.1L338.7 63l18.7 13.5L376 63l40-28.8v443.6zM344 144H104c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h240c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8z" class=""></path></svg>',
      'file-invoice':
        '<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M296 400h-80c-4.42 0-8 3.58-8 8v16c0 4.42 3.58 8 8 8h80c4.42 0 8-3.58 8-8v-16c0-4.42-3.58-8-8-8zM80 240v96c0 8.84 7.16 16 16 16h192c8.84 0 16-7.16 16-16v-96c0-8.84-7.16-16-16-16H96c-8.84 0-16 7.16-16 16zm32 16h160v64H112v-64zM369.83 97.98L285.94 14.1c-9-9-21.2-14.1-33.89-14.1H47.99C21.5.1 0 21.6 0 48.09v415.92C0 490.5 21.5 512 47.99 512h287.94c26.5 0 48.07-21.5 48.07-47.99V131.97c0-12.69-5.17-24.99-14.17-33.99zM255.95 51.99l76.09 76.08h-76.09V51.99zM336 464.01H47.99V48.09h159.97v103.98c0 13.3 10.7 23.99 24 23.99H336v287.95zM88 112h80c4.42 0 8-3.58 8-8V88c0-4.42-3.58-8-8-8H88c-4.42 0-8 3.58-8 8v16c0 4.42 3.58 8 8 8zm0 64h80c4.42 0 8-3.58 8-8v-16c0-4.42-3.58-8-8-8H88c-4.42 0-8 3.58-8 8v16c0 4.42 3.58 8 8 8z" class=""></path></svg>',
      'file-invoice-dollar':
        '<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M369.83 97.98L285.94 14.1c-9-9-21.2-14.1-33.89-14.1H47.99C21.5.1 0 21.6 0 48.09v415.92C0 490.5 21.5 512 47.99 512h287.94c26.5 0 48.07-21.5 48.07-47.99V131.97c0-12.69-5.17-24.99-14.17-33.99zM255.95 51.99l76.09 76.08h-76.09V51.99zM336 464.01H47.99V48.09h159.97v103.98c0 13.3 10.7 23.99 24 23.99H336v287.95zM208 216c0-4.42-3.58-8-8-8h-16c-4.42 0-8 3.58-8 8v24.12c-23.62.63-42.67 20.55-42.67 45.07 0 19.97 12.98 37.81 31.58 43.39l45 13.5c5.16 1.55 8.77 6.78 8.77 12.73 0 7.27-5.3 13.19-11.8 13.19h-28.11c-4.56 0-8.96-1.29-12.82-3.72-3.24-2.03-7.36-1.91-10.13.73l-11.75 11.21c-3.53 3.37-3.33 9.21.57 12.14 9.1 6.83 20.08 10.77 31.37 11.35V424c0 4.42 3.58 8 8 8h16c4.42 0 8-3.58 8-8v-24.12c23.62-.63 42.67-20.54 42.67-45.07 0-19.97-12.98-37.81-31.58-43.39l-45-13.5c-5.16-1.55-8.77-6.78-8.77-12.73 0-7.27 5.3-13.19 11.8-13.19h28.11c4.56 0 8.96 1.29 12.82 3.72 3.24 2.03 7.36 1.91 10.13-.73l11.75-11.21c3.53-3.37 3.33-9.21-.57-12.14-9.1-6.83-20.08-10.77-31.37-11.35V216zM88 112h80c4.42 0 8-3.58 8-8V88c0-4.42-3.58-8-8-8H88c-4.42 0-8 3.58-8 8v16c0 4.42 3.58 8 8 8zm88 56v-16c0-4.42-3.58-8-8-8H88c-4.42 0-8 3.58-8 8v16c0 4.42 3.58 8 8 8h80c4.42 0 8-3.58 8-8z" class=""></path></svg>',
      client:
        '<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" height="20" style="margin-left: -2px"><path fill="currentColor" d="M224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96zm91.9 256.2l-56.5 154.5L240 376l32-56h-96l32 56-19.5 82.7L132 304.2C58.9 305.5 0 365 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-73.4-58.9-132.9-132.1-134.2zM96 464H48v-25.6c0-35.4 21.9-66.2 53-79.4l38.4 105H96zm304 0h-91.3L347 359c31 13.2 53 44 53 79.4V464z" class=""></path></svg>',
      home:
        '<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" preserveAspectRatio="none" width="20" height="20" style="margin-left: -2px"><path fill="currentColor" d="M573.48 219.91L310.6 8a35.85 35.85 0 0 0-45.19 0L2.53 219.91a6.71 6.71 0 0 0-1 9.5l14.2 17.5a6.82 6.82 0 0 0 9.6 1L64 216.72V496a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V216.82l38.8 31.29a6.83 6.83 0 0 0 9.6-1l14.19-17.5a7.14 7.14 0 0 0-1.11-9.7zM240 480V320h96v160zm240 0H368V304a16 16 0 0 0-16-16H224a16 16 0 0 0-16 16v176H96V190.92l187.71-151.4a6.63 6.63 0 0 1 8.4 0L480 191z" class></path></svg>',
      logo:
        '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 184.44788 221.33725" version="1.1" id="svg8"> <defs id="defs2"> <clipPath id="clipPath4534" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path4532" d="M 0,1000 H 1000 V 0 H 0 Z" /> </clipPath> <clipPath id="clipPath4785" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path4783" d="M 0,1000 H 1000 V 0 H 0 Z" /> </clipPath> </defs> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.35" inkscape:cx="-110.0085" inkscape:cy="383.98944" inkscape:document-units="mm" inkscape:current-layer="layer1" showgrid="false" fit-margin-top="0" fit-margin-left="0" fit-margin-right="0" fit-margin-bottom="0" inkscape:window-width="1920" inkscape:window-height="1012" inkscape:window-x="-8" inkscape:window-y="37" inkscape:window-maximized="1" /> <metadata id="metadata5"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(-12.097486,-29.093287)"> <g transform="matrix(0.35277777,0,0,-0.35277777,-72.067564,316.15071)" inkscape:label="NORTAN - LOGO" id="g4777"> <g id="g4779"> <g clip-path="url(#clipPath4785)" id="g4781"> <g transform="translate(574.0458,624.2111)" id="g4787"> <path inkscape:connector-curvature="0" id="path4789" style="fill:#065b5d;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 -126.33,189.495 -122.808,-368.432 c 1.757,-5.628 3.777,-11.186 6.09,-16.657 9.237,-21.837 22.465,-41.453 39.317,-58.306 7.743,-7.743 16.077,-14.711 24.935,-20.889 l 78.088,234.335 58.19,-87.267 z" /> </g> <g transform="translate(669.0074,571.3824)" id="g4791"> <path inkscape:connector-curvature="0" id="path4793" style="fill:#7abb9e;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -9.236,21.837 -22.464,41.454 -39.316,58.306 -7.759,7.759 -16.11,14.739 -24.987,20.925 l -78.027,-234.299 -58.189,87.277 -42.644,-127.638 126.44,-189.66 L 6.068,-16.54 C 4.317,-10.951 2.298,-5.434 0,0" /> </g> <g transform="translate(390.1671,322.0059)" id="g4795"> <path inkscape:connector-curvature="0" id="path4797" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 -42.115,-34.722 18.966,51.296 c -46.508,38.358 -76.156,96.427 -76.156,161.42 0,40.218 11.363,77.778 31.038,109.664 l -34.668,42.229 51.266,-19.012 c 11.531,13.999 24.85,26.47 39.603,37.071 l 24.198,72.597 c -95.981,-38.699 -163.721,-132.711 -163.721,-242.549 0,-141.91 113.075,-257.408 254.04,-261.317 l -38.1,57.151 C 41.229,-21.04 19.545,-12.086 0,0" /> </g> <g transform="translate(507.3815,761.3167)" id="g4799"> <path inkscape:connector-curvature="0" id="path4801" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 38.1,-57.151 c 23.115,-5.13 44.793,-14.08 64.333,-26.16 l 42.11,34.718 -18.891,-51.267 -0.799,0.565 c 46.935,-38.351 76.903,-96.684 76.903,-162.022 0,-40.218 -11.362,-77.778 -31.038,-109.663 l 34.668,-42.229 -51.265,19.012 v 0 c -11.54,-14.009 -24.868,-26.487 -39.632,-37.092 l -24.183,-72.582 c 95.988,38.696 163.735,132.712 163.735,242.554 C 254.041,-119.406 140.966,-3.909 0,0" /> </g> </g> </g> </g> </g></svg>',
      logoWhite:
        '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 184.44788 221.33725" version="1.1" id="svg8"> <defs id="defs2"> <clipPath id="clipPath4534" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path4532" d="M 0,1000 H 1000 V 0 H 0 Z" /> </clipPath> <clipPath id="clipPath4785" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path4783" d="M 0,1000 H 1000 V 0 H 0 Z" /> </clipPath> <clipPath id="clipPath903" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path901" d="M 0,1080 H 1920 V 0 H 0 Z" /> </clipPath> </defs> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.35" inkscape:cx="-574.29421" inkscape:cy="570.85498" inkscape:document-units="mm" inkscape:current-layer="layer1" showgrid="false" fit-margin-top="0" fit-margin-left="0" fit-margin-right="0" fit-margin-bottom="0" inkscape:window-width="1920" inkscape:window-height="1012" inkscape:window-x="-8" inkscape:window-y="37" inkscape:window-maximized="1" /> <metadata id="metadata5"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(-12.097486,-29.093287)"> <g transform="matrix(0.35277777,0,0,-0.35277777,-72.067564,316.15071)" inkscape:label="NORTAN - LOGO" id="g4777" style="fill:#ffffff;fill-opacity:1"> <g id="g4779" style="fill:#ffffff;fill-opacity:1"> <g clip-path="url(#clipPath4785)" id="g4781" style="fill:#ffffff;fill-opacity:1"> <g transform="translate(574.0458,624.2111)" id="g4787" style="fill:#ffffff;fill-opacity:1"> <path inkscape:connector-curvature="0" id="path4789" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 -126.33,189.495 -122.808,-368.432 c 1.757,-5.628 3.777,-11.186 6.09,-16.657 9.237,-21.837 22.465,-41.453 39.317,-58.306 7.743,-7.743 16.077,-14.711 24.935,-20.889 l 78.088,234.335 58.19,-87.267 z" /> </g> <g transform="translate(669.0074,571.3824)" id="g4791" style="fill:#ffffff;fill-opacity:1"> <path inkscape:connector-curvature="0" id="path4793" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -9.236,21.837 -22.464,41.454 -39.316,58.306 -7.759,7.759 -16.11,14.739 -24.987,20.925 l -78.027,-234.299 -58.189,87.277 -42.644,-127.638 126.44,-189.66 L 6.068,-16.54 C 4.317,-10.951 2.298,-5.434 0,0" /> </g> <g transform="translate(390.1671,322.0059)" id="g4795" style="fill:#ffffff;fill-opacity:1"> <path inkscape:connector-curvature="0" id="path4797" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 -42.115,-34.722 18.966,51.296 c -46.508,38.358 -76.156,96.427 -76.156,161.42 0,40.218 11.363,77.778 31.038,109.664 l -34.668,42.229 51.266,-19.012 c 11.531,13.999 24.85,26.47 39.603,37.071 l 24.198,72.597 c -95.981,-38.699 -163.721,-132.711 -163.721,-242.549 0,-141.91 113.075,-257.408 254.04,-261.317 l -38.1,57.151 C 41.229,-21.04 19.545,-12.086 0,0" /> </g> <g transform="translate(507.3815,761.3167)" id="g4799" style="fill:#ffffff;fill-opacity:1"> <path inkscape:connector-curvature="0" id="path4801" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 38.1,-57.151 c 23.115,-5.13 44.793,-14.08 64.333,-26.16 l 42.11,34.718 -18.891,-51.267 -0.799,0.565 c 46.935,-38.351 76.903,-96.684 76.903,-162.022 0,-40.218 -11.362,-77.778 -31.038,-109.663 l 34.668,-42.229 -51.265,19.012 v 0 c -11.54,-14.009 -24.868,-26.487 -39.632,-37.092 l -24.183,-72.582 c 95.988,38.696 163.735,132.712 163.735,242.554 C 254.041,-119.406 140.966,-3.909 0,0" /> </g> </g> </g> </g> </g> </svg>',
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.menuService
      .onItemSelect()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: { tag: string; item: any }) => {
        if (this.layout.sidebarRef.nativeElement.classList.contains('expanded'))
          this.toggleSidebar();
      });
  }

  ngDoCheck(): void {
    for (const menu of this.menu) {
      if (menu['selected'] && menu['link'] !== this.router.url) {
        menu['selected'] = false;
      }
    }
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }
}
