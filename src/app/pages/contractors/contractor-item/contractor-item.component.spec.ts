import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ContractorItemComponent } from './contractor-item.component';

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
