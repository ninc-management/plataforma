import { TestBed } from '@angular/core/testing';

import { OnedriveService } from './onedrive.service';

describe('OnedriveService', () => {
  let service: OnedriveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnedriveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
