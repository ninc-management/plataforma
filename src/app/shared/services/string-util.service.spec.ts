import { TestBed } from '@angular/core/testing';

import { StringUtilService } from './string-util.service';

describe('StringUtilService', () => {
  let service: StringUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StringUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
