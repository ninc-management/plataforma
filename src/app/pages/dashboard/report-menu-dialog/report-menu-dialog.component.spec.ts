import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ReportMenuDialogComponent } from './report-menu-dialog.component';

describe('ReportMenuDialogComponent', () => {
  let component: ReportMenuDialogComponent;
  let fixture: ComponentFixture<ReportMenuDialogComponent>;

  CommonTestingModule.setUpTestBed(ReportMenuDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportMenuDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
