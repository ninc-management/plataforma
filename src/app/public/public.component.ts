import { Component, OnDestroy } from '@angular/core';
import { PlatformConfig } from '@models/platformConfig';
import { NbIconLibraries } from '@nebular/theme';
import { ConfigService } from 'app/shared/services/config.service';
import { combineLatest, skipWhile, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'ngx-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.scss'],
})
export class NgxPublicComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  config: PlatformConfig = new PlatformConfig();
  constructor(private iconsLibrary: NbIconLibraries, private configService: ConfigService) {
    combineLatest([this.configService.isDataLoaded$, this.configService.getConfig()])
      .pipe(
        skipWhile(([configLoaded, config]) => !configLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([configLoaded, config]) => {
        this.config = config[0];
      });
    // NINC: change for each new client
    iconsLibrary.registerSvgPack('fac', {
      logo: '<svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 184.44788 221.33725" version="1.1" id="svg8"> <defs id="defs2"> <clipPath id="clipPath4534" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path4532" d="M 0,1000 H 1000 V 0 H 0 Z" /> </clipPath> <clipPath id="clipPath4785" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path4783" d="M 0,1000 H 1000 V 0 H 0 Z" /> </clipPath> </defs> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.35" inkscape:cx="-110.0085" inkscape:cy="383.98944" inkscape:document-units="mm" inkscape:current-layer="layer1" showgrid="false" fit-margin-top="0" fit-margin-left="0" fit-margin-right="0" fit-margin-bottom="0" inkscape:window-width="1920" inkscape:window-height="1012" inkscape:window-x="-8" inkscape:window-y="37" inkscape:window-maximized="1" /> <metadata id="metadata5"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(-12.097486,-29.093287)"> <g transform="matrix(0.35277777,0,0,-0.35277777,-72.067564,316.15071)" inkscape:label="NORTAN - LOGO" id="g4777"> <g id="g4779"> <g clip-path="url(#clipPath4785)" id="g4781"> <g transform="translate(574.0458,624.2111)" id="g4787"> <path inkscape:connector-curvature="0" id="path4789" style="fill:#065b5d;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 -126.33,189.495 -122.808,-368.432 c 1.757,-5.628 3.777,-11.186 6.09,-16.657 9.237,-21.837 22.465,-41.453 39.317,-58.306 7.743,-7.743 16.077,-14.711 24.935,-20.889 l 78.088,234.335 58.19,-87.267 z" /> </g> <g transform="translate(669.0074,571.3824)" id="g4791"> <path inkscape:connector-curvature="0" id="path4793" style="fill:#7abb9e;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -9.236,21.837 -22.464,41.454 -39.316,58.306 -7.759,7.759 -16.11,14.739 -24.987,20.925 l -78.027,-234.299 -58.189,87.277 -42.644,-127.638 126.44,-189.66 L 6.068,-16.54 C 4.317,-10.951 2.298,-5.434 0,0" /> </g> <g transform="translate(390.1671,322.0059)" id="g4795"> <path inkscape:connector-curvature="0" id="path4797" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 -42.115,-34.722 18.966,51.296 c -46.508,38.358 -76.156,96.427 -76.156,161.42 0,40.218 11.363,77.778 31.038,109.664 l -34.668,42.229 51.266,-19.012 c 11.531,13.999 24.85,26.47 39.603,37.071 l 24.198,72.597 c -95.981,-38.699 -163.721,-132.711 -163.721,-242.549 0,-141.91 113.075,-257.408 254.04,-261.317 l -38.1,57.151 C 41.229,-21.04 19.545,-12.086 0,0" /> </g> <g transform="translate(507.3815,761.3167)" id="g4799"> <path inkscape:connector-curvature="0" id="path4801" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 38.1,-57.151 c 23.115,-5.13 44.793,-14.08 64.333,-26.16 l 42.11,34.718 -18.891,-51.267 -0.799,0.565 c 46.935,-38.351 76.903,-96.684 76.903,-162.022 0,-40.218 -11.362,-77.778 -31.038,-109.663 l 34.668,-42.229 -51.265,19.012 v 0 c -11.54,-14.009 -24.868,-26.487 -39.632,-37.092 l -24.183,-72.582 c 95.988,38.696 163.735,132.712 163.735,242.554 C 254.041,-119.406 140.966,-3.909 0,0" /> </g> </g> </g> </g> </g></svg>',
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
