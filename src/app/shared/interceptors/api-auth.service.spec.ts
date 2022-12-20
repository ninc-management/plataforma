import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ApiAuthService } from './api-auth.service';

describe('ApiAuthService', () => {
  let service: ApiAuthService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(ApiAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
