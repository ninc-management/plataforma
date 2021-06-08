import { TestBed } from '@angular/core/testing';

import { MetricsService } from './metrics.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('MetricsService', () => {
  let service: MetricsService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(MetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
