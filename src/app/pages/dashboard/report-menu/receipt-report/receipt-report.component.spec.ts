import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ReceiptReportComponent } from './receipt-report.component';

describe('ReceiptReportComponent', () => {
  let component: ReceiptReportComponent;
  let fixture: ComponentFixture<ReceiptReportComponent>;

  CommonTestingModule.setUpTestBed(ReceiptReportComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
