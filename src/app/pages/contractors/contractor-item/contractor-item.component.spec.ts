import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorItemComponent } from './contractor-item.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ContractorItemComponent', () => {
  let component: ContractorItemComponent;
  let fixture: ComponentFixture<ContractorItemComponent>;

  CommonTestingModule.setUpTestBed(ContractorItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractorItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
