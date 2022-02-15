import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ProspectService } from './prospect.service';

describe('ProspectService', () => {
  let service: ProspectService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(ProspectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
