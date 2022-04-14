import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatformConfig } from '@models/platformConfig';
import { CommonTestingModule } from 'common-testing.module';
import { NbIconLibraries } from '@nebular/theme';

import { ConfigDialogComponent } from './config-dialog.component';

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
