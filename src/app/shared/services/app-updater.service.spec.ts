import { TestBed } from '@angular/core/testing';

import { AppUpdaterService } from './app-updater.service';

describe('AppUpdaterService', () => {
  let service: AppUpdaterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppUpdaterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
