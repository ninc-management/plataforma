import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NbIconLibraries } from '@nebular/theme';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ContractDialogComponent } from './contract-dialog.component';
import { registerIcons } from 'app/shared/icon-utils';

describe('ContractDialogComponent', () => {
  let iconsLibrary: NbIconLibraries;
  let component: ContractDialogComponent;
  let fixture: ComponentFixture<ContractDialogComponent>;

  CommonTestingModule.setUpTestBed(ContractDialogComponent);

  beforeEach(() => {
    iconsLibrary = TestBed.inject(NbIconLibraries);
    registerIcons(iconsLibrary);
    fixture = TestBed.createComponent(ContractDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
