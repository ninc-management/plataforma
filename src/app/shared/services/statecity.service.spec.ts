import { TestBed } from '@angular/core/testing';

import { StatecityService } from './statecity.service';

describe('StatecityService', () => {
  let service: StatecityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatecityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
