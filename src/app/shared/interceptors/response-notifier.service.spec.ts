import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ResponseNotifierService } from './response-notifier.service';

describe('ErrorNotifierService', () => {
  let service: ResponseNotifierService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(ResponseNotifierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
