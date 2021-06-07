import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptItemComponent } from './receipt-item.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ReceiptItemComponent', () => {
  let component: ReceiptItemComponent;
  let fixture: ComponentFixture<ReceiptItemComponent>;

  CommonTestingModule.setUpTestBed(ReceiptItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
