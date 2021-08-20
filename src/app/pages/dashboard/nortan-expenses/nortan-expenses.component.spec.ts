import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NortanExpensesComponent } from './nortan-expenses.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('NortanExpensesComponent', () => {
  let component: NortanExpensesComponent;
  let fixture: ComponentFixture<NortanExpensesComponent>;

  CommonTestingModule.setUpTestBed(NortanExpensesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NortanExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
