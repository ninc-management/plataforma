import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ExpenseTabComponent } from './expense-tab.component';

describe('ExpenseTabComponent', () => {
  let component: ExpenseTabComponent;
  let fixture: ComponentFixture<ExpenseTabComponent>;

  CommonTestingModule.setUpTestBed(ExpenseTabComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
