import { TestBed } from '@angular/core/testing';

import { ContractService } from './contract.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ContractService', () => {
  let service: ContractService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(ContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
