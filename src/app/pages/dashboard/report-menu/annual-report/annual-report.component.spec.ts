import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { AnnualReportComponent } from './annual-report.component';

describe('AnnualReportComponent', () => {
  let component: AnnualReportComponent;
  let fixture: ComponentFixture<AnnualReportComponent>;

  CommonTestingModule.setUpTestBed(AnnualReportComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
