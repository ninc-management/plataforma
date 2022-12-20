import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ContractorDialogComponent } from './contractor-dialog.component';

describe('ContractorDialogComponent', () => {
  let component: ContractorDialogComponent;
  let fixture: ComponentFixture<ContractorDialogComponent>;

  CommonTestingModule.setUpTestBed(ContractorDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
