import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NortanExpenseDialogComponent } from './nortan-expense-dialog.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('NortanExpenseDialogComponent', () => {
  let component: NortanExpenseDialogComponent;
  let fixture: ComponentFixture<NortanExpenseDialogComponent>;

  CommonTestingModule.setUpTestBed(NortanExpenseDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NortanExpenseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
