import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NbIconLibraries } from '@nebular/theme';
import { CommonTestingModule } from 'common-testing.module';

import { BalanceTabComponent } from './balance-tab.component';
import { registerIcons } from 'app/shared/icon-utils';

describe('BalanceTabComponent', () => {
  let component: BalanceTabComponent;
  let fixture: ComponentFixture<BalanceTabComponent>;
  let iconsLibrary: NbIconLibraries;

  CommonTestingModule.setUpTestBed(BalanceTabComponent);

  beforeEach(() => {
    iconsLibrary = TestBed.inject(NbIconLibraries);
    registerIcons(iconsLibrary);
    fixture = TestBed.createComponent(BalanceTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
