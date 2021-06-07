import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractsComponent } from './contracts.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ContractsComponent', () => {
  let component: ContractsComponent;
  let fixture: ComponentFixture<ContractsComponent>;

  CommonTestingModule.setUpTestBed(ContractsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
