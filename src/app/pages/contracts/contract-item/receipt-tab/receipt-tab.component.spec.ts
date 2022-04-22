import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ReceiptTabComponent } from './receipt-tab.component';

describe('ReceiptTabComponent', () => {
  let component: ReceiptTabComponent;
  let fixture: ComponentFixture<ReceiptTabComponent>;

  CommonTestingModule.setUpTestBed(ReceiptTabComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
