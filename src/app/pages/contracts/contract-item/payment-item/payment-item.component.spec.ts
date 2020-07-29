import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentItemComponent } from './payment-item.component';

describe('PaymentItemComponent', () => {
  let component: PaymentItemComponent;
  let fixture: ComponentFixture<PaymentItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PaymentItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
