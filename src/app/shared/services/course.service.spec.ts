import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { CourseService } from './course.service';

describe('CourseService', () => {
  let service: CourseService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(CourseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
