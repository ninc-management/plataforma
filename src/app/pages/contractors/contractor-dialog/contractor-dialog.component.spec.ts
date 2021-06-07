import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorDialogComponent } from './contractor-dialog.component';
import { CommonTestingModule } from 'app/../common-testing.module';

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
