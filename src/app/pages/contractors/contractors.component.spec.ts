import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorsComponent } from './contractors.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ContractorsComponent', () => {
  let component: ContractorsComponent;
  let fixture: ComponentFixture<ContractorsComponent>;

  CommonTestingModule.setUpTestBed(ContractorsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
