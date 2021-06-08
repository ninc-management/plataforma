import { TestBed } from '@angular/core/testing';

import { DepartmentService } from './department.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('DepartmentService', () => {
  let service: DepartmentService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(DepartmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
