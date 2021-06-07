import { TestBed } from '@angular/core/testing';

import { StatecityService } from './statecity.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('StatecityService', () => {
  let service: StatecityService;

  CommonTestingModule.setUpTestBedService(StatecityService);

  beforeEach(() => {
    service = TestBed.get(StatecityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
