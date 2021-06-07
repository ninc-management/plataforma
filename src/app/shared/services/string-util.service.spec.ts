import { TestBed } from '@angular/core/testing';

import { StringUtilService } from './string-util.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('StringUtilService', () => {
  let service: StringUtilService;

  CommonTestingModule.setUpTestBedService(StringUtilService);

  beforeEach(() => {
    service = TestBed.get(StringUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
