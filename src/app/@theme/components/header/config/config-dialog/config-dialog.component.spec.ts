import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NbIconLibraries } from '@nebular/theme';
import { CommonTestingModule } from 'common-testing.module';

import { ConfigDialogComponent } from './config-dialog.component';

import { PlatformConfig } from '@models/platformConfig';

describe('ConfigDialogComponent', () => {
  let component: ConfigDialogComponent;
  let fixture: ComponentFixture<ConfigDialogComponent>;
  let iconsLibrary: NbIconLibraries;
  CommonTestingModule.setUpTestBed(ConfigDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigDialogComponent);
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
