import { TestBed } from '@angular/core/testing';

import { PromotionService } from './promotion.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('PromotionService', () => {
  let service: PromotionService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(PromotionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
