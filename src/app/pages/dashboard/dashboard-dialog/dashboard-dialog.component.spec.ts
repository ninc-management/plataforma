import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDialogComponent } from './dashboard-dialog.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('DashboardDialogComponent', () => {
  let component: DashboardDialogComponent;
  let fixture: ComponentFixture<DashboardDialogComponent>;

  CommonTestingModule.setUpTestBed(DashboardDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
