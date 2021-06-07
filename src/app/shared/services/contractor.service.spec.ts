import { TestBed } from '@angular/core/testing';

import { ContractorService } from './contractor.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ContractorService', () => {
  let service: ContractorService;

  CommonTestingModule.setUpTestBedService(ContractorService);

  beforeEach(() => {
    service = TestBed.get(ContractorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
