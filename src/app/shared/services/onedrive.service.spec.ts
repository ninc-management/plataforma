import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';
import { cloneDeep } from 'lodash';

import { externalMockedConfigs } from '../mocked-data/mocked-config';
import { DEFAULT_CONFIG } from './config.service';
import { OneDriveService } from './onedrive.service';

describe('OnedriveService', () => {
  let service: OneDriveService;
  let httpMock: HttpTestingController;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(OneDriveService);
    httpMock = TestBed.inject(HttpTestingController);
    const teamReq = httpMock.expectOne('/api/team/all');
    expect(teamReq.request.method).toBe('POST');
    teamReq.flush([]);
    const configReq = httpMock.expectOne('/api/config/all');
    const tmpConfig = cloneDeep(DEFAULT_CONFIG) as any;
    tmpConfig._id = '0';
    const mockedConfigs = cloneDeep(externalMockedConfigs);
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
