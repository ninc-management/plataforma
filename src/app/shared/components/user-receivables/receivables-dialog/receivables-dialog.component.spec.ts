import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ReceivablesDialogComponent } from './receivables-dialog.component';

describe('ReceivablesDialogComponent', () => {
  let component: ReceivablesDialogComponent;
  let fixture: ComponentFixture<ReceivablesDialogComponent>;

  CommonTestingModule.setUpTestBed(ReceivablesDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceivablesDialogComponent);
    component = fixture.componentInstance;
    component.userReceivableContracts = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
