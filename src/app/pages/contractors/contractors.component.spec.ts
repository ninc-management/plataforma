import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ContractorsComponent } from './contractors.component';

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
