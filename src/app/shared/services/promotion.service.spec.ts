import { TestBed } from '@angular/core/testing';

import { PromotionService } from './promotion.service';

describe('ContractorService', () => {
  let service: PromotionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(v);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
