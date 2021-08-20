import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NortanExpenseItemComponent } from './nortan-expense-item.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('NortanExpenseItemComponent', () => {
  let component: NortanExpenseItemComponent;
  let fixture: ComponentFixture<NortanExpenseItemComponent>;

  CommonTestingModule.setUpTestBed(NortanExpenseItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NortanExpenseItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
