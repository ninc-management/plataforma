import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NbIconLibraries } from '@nebular/theme';
import { CommonTestingModule } from 'app/../common-testing.module';

import { InvoiceDialogComponent } from './invoice-dialog.component';
import { registerIcons } from 'app/shared/icon-utils';

describe('InvoiceDialogComponent', () => {
  let component: InvoiceDialogComponent;
  let fixture: ComponentFixture<InvoiceDialogComponent>;
  let iconsLibrary: NbIconLibraries;

  CommonTestingModule.setUpTestBed(InvoiceDialogComponent);

  beforeEach(() => {
    iconsLibrary = TestBed.inject(NbIconLibraries);
    registerIcons(iconsLibrary);
    fixture = TestBed.createComponent(InvoiceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
