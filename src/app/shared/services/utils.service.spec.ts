import { TestBed } from '@angular/core/testing';

import { UtilsService } from './utils.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('UtilsService', () => {
  let service: UtilsService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(UtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
