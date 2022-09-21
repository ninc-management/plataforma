import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { AppUpdaterService } from './app-updater.service';

describe('AppUpdaterService', () => {
  let service: AppUpdaterService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(AppUpdaterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
