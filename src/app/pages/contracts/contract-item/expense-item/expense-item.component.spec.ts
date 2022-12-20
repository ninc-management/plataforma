import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ExpenseItemComponent } from './expense-item.component';

describe('ExpenseItemComponent', () => {
  let component: ExpenseItemComponent;
  let fixture: ComponentFixture<ExpenseItemComponent>;

  CommonTestingModule.setUpTestBed(ExpenseItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
