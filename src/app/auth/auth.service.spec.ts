import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('AuthService', () => {
  let service: AuthService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
