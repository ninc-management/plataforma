import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { OngoingContractsReportComponent } from './ongoing-contracts-report.component';

describe('OngoingContractsReportComponent', () => {
  let component: OngoingContractsReportComponent;
  let fixture: ComponentFixture<OngoingContractsReportComponent>;

  CommonTestingModule.setUpTestBed(OngoingContractsReportComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(OngoingContractsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
