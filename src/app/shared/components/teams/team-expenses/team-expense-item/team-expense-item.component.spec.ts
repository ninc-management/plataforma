import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamExpenseItemComponent } from './team-expense-item.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('NortanExpenseItemComponent', () => {
  let component: TeamExpenseItemComponent;
  let fixture: ComponentFixture<TeamExpenseItemComponent>;

  CommonTestingModule.setUpTestBed(TeamExpenseItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamExpenseItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
