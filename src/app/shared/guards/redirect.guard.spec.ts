import { TestBed } from '@angular/core/testing';

import { RedirectGuard } from './redirect.guard';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('RedirectGuard', () => {
  let guard: RedirectGuard;

  CommonTestingModule.setUpTestBedService(RedirectGuard);

  beforeEach(() => {
    guard = TestBed.get(RedirectGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
