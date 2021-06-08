import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('StorageService', () => {
  let service: StorageService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
