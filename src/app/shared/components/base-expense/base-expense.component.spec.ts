import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { BaseExpenseComponent } from './base-expense.component';

describe('BaseExpenseComponent', () => {
  let component: BaseExpenseComponent;
  let fixture: ComponentFixture<BaseExpenseComponent>;

  CommonTestingModule.setUpTestBed(BaseExpenseComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
