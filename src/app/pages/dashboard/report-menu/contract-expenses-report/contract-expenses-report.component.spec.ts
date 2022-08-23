import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ContractExpensesReportComponent } from './contract-expenses-report.component';

describe('ContractExpensesReportComponent', () => {
  let component: ContractExpensesReportComponent;
  let fixture: ComponentFixture<ContractExpensesReportComponent>;

  CommonTestingModule.setUpTestBed(ContractExpensesReportComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractExpensesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
