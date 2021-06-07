import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('StorageService', () => {
  let service: StorageService;

  CommonTestingModule.setUpTestBedService(StorageService);

  beforeEach(() => {
    service = TestBed.get(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
