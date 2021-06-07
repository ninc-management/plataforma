import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractItemComponent } from './contract-item.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ContractItemComponent', () => {
  let component: ContractItemComponent;
  let fixture: ComponentFixture<ContractItemComponent>;

  CommonTestingModule.setUpTestBed(ContractItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
