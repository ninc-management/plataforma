import { TestBed } from '@angular/core/testing';

import { MetricsService } from './metrics.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { HttpTestingController } from '@angular/common/http/testing';

describe('MetricsService', () => {
  let service: MetricsService;
  let httpMock: HttpTestingController;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(MetricsService);
    httpMock = TestBed.inject(HttpTestingController);
    const teamReq = httpMock.expectOne('/api/team/all');
    expect(teamReq.request.method).toBe('POST');
    teamReq.flush([]);
    const configReq = httpMock.expectOne('/api/config/all');
    expect(configReq.request.method).toBe('POST');
    configReq.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
