import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { TeamExpensesComponent } from './team-expenses.component';

describe('TeamExpensesComponent', () => {
  let component: TeamExpensesComponent;
  let fixture: ComponentFixture<TeamExpensesComponent>;

  CommonTestingModule.setUpTestBed(TeamExpensesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
