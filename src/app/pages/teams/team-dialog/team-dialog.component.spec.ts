import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamDialogComponent } from './team-dialog.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('TeamDialogComponent', () => {
  let component: TeamDialogComponent;
  let fixture: ComponentFixture<TeamDialogComponent>;

  CommonTestingModule.setUpTestBed(TeamDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
