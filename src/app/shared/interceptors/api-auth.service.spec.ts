import { TestBed } from '@angular/core/testing';

import { ApiAuthService } from './api-auth.service';
import { CommonTestingModule } from 'app/../common-testing.module';

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
