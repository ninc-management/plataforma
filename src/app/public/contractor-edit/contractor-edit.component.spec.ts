import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ContractorEditComponent } from './contractor-edit.component';

describe('ContractorEditComponent', () => {
  let component: ContractorEditComponent;
  let fixture: ComponentFixture<ContractorEditComponent>;

  CommonTestingModule.setUpTestBed();

  beforeEach(async () => {
    fixture = TestBed.createComponent(ContractorEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
