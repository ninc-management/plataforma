import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDialogComponent } from './invoice-dialog.component';
import { CommonTestingModule } from 'app/../common-testing.module';
import { NbIconLibraries } from '@nebular/theme';

describe('InvoiceDialogComponent', () => {
  let component: InvoiceDialogComponent;
  let fixture: ComponentFixture<InvoiceDialogComponent>;
  let iconsLibrary: NbIconLibraries;

  CommonTestingModule.setUpTestBed(InvoiceDialogComponent);

  beforeEach(() => {
    iconsLibrary = TestBed.inject(NbIconLibraries);
    iconsLibrary.registerFontPack('far', {
      packClass: 'far',
      iconClassPrefix: 'fa',
    });
    fixture = TestBed.createComponent(InvoiceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
