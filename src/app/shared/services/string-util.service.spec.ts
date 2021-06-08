import { TestBed } from '@angular/core/testing';

import { StringUtilService } from './string-util.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('StringUtilService', () => {
  let service: StringUtilService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(StringUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
