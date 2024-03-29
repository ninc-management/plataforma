import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { CourseDialogComponent } from './course-dialog.component';

describe('CourseDialogComponent', () => {
  let component: CourseDialogComponent;
  let fixture: ComponentFixture<CourseDialogComponent>;

  CommonTestingModule.setUpTestBed(CourseDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
