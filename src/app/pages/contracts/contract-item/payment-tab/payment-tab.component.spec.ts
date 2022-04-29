import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { PaymentTabComponent } from './payment-tab.component';

describe('PaymentTabComponent', () => {
  let component: PaymentTabComponent;
  let fixture: ComponentFixture<PaymentTabComponent>;

  CommonTestingModule.setUpTestBed(PaymentTabComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
