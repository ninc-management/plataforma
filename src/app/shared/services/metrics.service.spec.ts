import { TestBed } from '@angular/core/testing';

import { MetricsService } from './metrics.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('MetricsService', () => {
  let service: MetricsService;

  CommonTestingModule.setUpTestBedService(MetricsService);

  beforeEach(() => {
    service = TestBed.get(MetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
