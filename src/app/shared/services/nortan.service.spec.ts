import { TestBed } from '@angular/core/testing';

import { NortanService } from './nortan.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('NortanService', () => {
  let service: NortanService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(NortanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
