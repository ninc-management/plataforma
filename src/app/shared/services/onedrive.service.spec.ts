import { TestBed } from '@angular/core/testing';

import { OnedriveService } from './onedrive.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('OnedriveService', () => {
  let service: OnedriveService;

  CommonTestingModule.setUpTestBedService(OnedriveService);

  beforeEach(() => {
    service = TestBed.get(OnedriveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
