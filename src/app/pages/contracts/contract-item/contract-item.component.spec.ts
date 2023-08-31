import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NbIconLibraries } from '@nebular/theme';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ContractItemComponent } from './contract-item.component';
import { registerIcons } from 'app/shared/icon-utils';

describe('ContractItemComponent', () => {
  let component: ContractItemComponent;
  let fixture: ComponentFixture<ContractItemComponent>;
  let iconsLibrary: NbIconLibraries;

  CommonTestingModule.setUpTestBed(ContractItemComponent);

  beforeEach(() => {
    iconsLibrary = TestBed.inject(NbIconLibraries);
    registerIcons(iconsLibrary);
    fixture = TestBed.createComponent(ContractItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
