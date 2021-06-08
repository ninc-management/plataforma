import { TestBed } from '@angular/core/testing';

import { StatecityService } from './statecity.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('StatecityService', () => {
  let service: StatecityService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(StatecityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
