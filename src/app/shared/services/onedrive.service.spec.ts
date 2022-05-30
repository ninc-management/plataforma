import { TestBed } from '@angular/core/testing';

import { OneDriveService } from './onedrive.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { HttpTestingController } from '@angular/common/http/testing';

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
