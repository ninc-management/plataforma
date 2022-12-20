import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { PdfDialogComponent } from './pdf-dialog.component';

describe('PdfDialogComponent', () => {
  let component: PdfDialogComponent;
  let fixture: ComponentFixture<PdfDialogComponent>;

  CommonTestingModule.setUpTestBed(PdfDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
