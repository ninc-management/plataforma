import { TestBed } from '@angular/core/testing';

import { InvoiceService } from './invoice.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('InvoiceService', () => {
  let service: InvoiceService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(InvoiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
