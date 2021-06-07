import { TestBed } from '@angular/core/testing';

import { ContractService } from './contract.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ContractService', () => {
  let service: ContractService;

  CommonTestingModule.setUpTestBedService(ContractService);

  beforeEach(() => {
    service = TestBed.get(ContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
