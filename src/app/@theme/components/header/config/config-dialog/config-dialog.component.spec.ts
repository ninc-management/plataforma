import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NbIconLibraries } from '@nebular/theme';
import { CommonTestingModule } from 'common-testing.module';

import { ConfigDialogComponent } from './config-dialog.component';
import { registerIcons } from 'app/shared/icon-utils';

describe('ConfigDialogComponent', () => {
  let component: ConfigDialogComponent;
  let fixture: ComponentFixture<ConfigDialogComponent>;
  let iconsLibrary: NbIconLibraries;
  CommonTestingModule.setUpTestBed(ConfigDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigDialogComponent);
    iconsLibrary = TestBed.inject(NbIconLibraries);
    registerIcons(iconsLibrary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
