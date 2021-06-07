import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('UserService', () => {
  let service: UserService;

  CommonTestingModule.setUpTestBedService(UserService);

  beforeEach(() => {
    service = TestBed.get(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
