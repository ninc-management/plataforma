import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth.guard';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  CommonTestingModule.setUpTestBedService(AuthGuard);

  beforeEach(() => {
    guard = TestBed.get(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
