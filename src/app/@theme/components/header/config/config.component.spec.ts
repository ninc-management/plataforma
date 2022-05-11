import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatformConfig } from '@models/platformConfig';
import { CommonTestingModule } from 'common-testing.module';
import { NbIconLibraries } from '@nebular/theme';

import { ConfigComponent } from './config.component';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;
  let iconsLibrary: NbIconLibraries;

  CommonTestingModule.setUpTestBed(ConfigComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigComponent);
    iconsLibrary = TestBed.inject(NbIconLibraries);
    iconsLibrary.registerFontPack('fa', {
      packClass: 'fa',
      iconClassPrefix: 'fa',
    });
    iconsLibrary.registerFontPack('ion', {
      packClass: 'ion',
      iconClassPrefix: 'ion',
    });
    iconsLibrary.registerSvgPack('fac', {
      minus: '<svg></svg>',
    });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
