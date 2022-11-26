import { TestBed } from '@angular/core/testing';

import { HttpTestingController } from '@angular/common/http/testing';
import { cloneDeep } from 'lodash';
import { CommonTestingModule } from 'app/../common-testing.module';
import { MetricsService } from './metrics.service';
import { DEFAULT_CONFIG } from './config.service';

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
    const transactionReq = httpMock.expectOne('/api/transaction/all');
    expect(transactionReq.request.method).toBe('POST');
    transactionReq.flush([]);
    const configReq = httpMock.expectOne('/api/config/all');
    const tmpConfig = cloneDeep(DEFAULT_CONFIG) as any;
    tmpConfig._id = '0';
    const mockedConfigs = [tmpConfig];
    expect(configReq.request.method).toBe('POST');
    configReq.flush(mockedConfigs);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
