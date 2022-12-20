import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { WebSocketService } from './web-socket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(WebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
