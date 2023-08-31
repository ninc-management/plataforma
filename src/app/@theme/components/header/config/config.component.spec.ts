import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NbIconLibraries } from '@nebular/theme';
import { CommonTestingModule } from 'common-testing.module';

import { ConfigComponent } from './config.component';
import { registerIcons } from 'app/shared/icon-utils';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;
  let iconsLibrary: NbIconLibraries;

  CommonTestingModule.setUpTestBed(ConfigComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigComponent);
    iconsLibrary = TestBed.inject(NbIconLibraries);
    registerIcons(iconsLibrary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
