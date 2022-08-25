import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { AnnualUsersReportComponent } from './annual-users-report.component';

describe('AnnualUsersReportComponent', () => {
  let component: AnnualUsersReportComponent;
  let fixture: ComponentFixture<AnnualUsersReportComponent>;

  CommonTestingModule.setUpTestBed(AnnualUsersReportComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnualUsersReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
