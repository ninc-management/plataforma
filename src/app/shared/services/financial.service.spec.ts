import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { FinancialService } from './financial.service';

describe('FinancialService', () => {
  let service: FinancialService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(FinancialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
