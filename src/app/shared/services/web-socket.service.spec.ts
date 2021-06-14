import { TestBed } from '@angular/core/testing';

import { WebSocketService } from './web-socket.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { BehaviorSubject } from 'rxjs';

interface MockedUser {
  _id: string;
  name: string;
  remove?: string;
}

describe('WebSocketService', () => {
  let service: WebSocketService;
  const users$ = new BehaviorSubject<MockedUser[]>([]);
  const data = {
    ns: {
      coll: 'users',
    },
    operationType: 'update',
    documentKey: {
      _id: '0',
    },
    fullDocument: {},
    updateDescription: {
      updatedFields: {},
      removedFields: [] as any[],
    },
  };

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(WebSocketService);
    users$.next([{ _id: '0', name: 'Test', remove: 'test' }]);
    spyOn(console, 'log');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle update', () => {
    data.operationType = 'update';
    data.updateDescription.updatedFields = { name: 'Test works' };
    data.updateDescription.removedFields.push('remove');
    service.handle(data, users$, 'users');
    expect(users$.value.length).toBe(1);
    expect(users$.value).toEqual([{ _id: '0', name: 'Test works' }]);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should handle inset', () => {
    data.operationType = 'insert';
    data.fullDocument = { _id: '1', name: 'Test works' };
    service.handle(data, users$, 'users');
    expect(users$.value.length).toBe(2);
    expect(users$.value).toEqual([
      { _id: '0', name: 'Test', remove: 'test' },
      { _id: '1', name: 'Test works' },
    ]);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should handle other cases', () => {
    data.operationType = 'test';
    service.handle(data, users$, 'users');
    expect(console.log).toHaveBeenCalled();
  });
});
