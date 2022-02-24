import { TestBed } from '@angular/core/testing';

import { OnedriveService } from './onedrive.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { HttpTestingController } from '@angular/common/http/testing';

describe('OnedriveService', () => {
  let service: OnedriveService;
  let httpMock: HttpTestingController;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(OnedriveService);
    httpMock = TestBed.inject(HttpTestingController);
    const teamReq = httpMock.expectOne('/api/team/all');
    expect(teamReq.request.method).toBe('POST');
    teamReq.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
