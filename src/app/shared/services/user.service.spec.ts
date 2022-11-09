import { TestBed } from '@angular/core/testing';

import { UserService, CONTRACT_BALANCE } from './user.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { last, take, mergeMap } from 'rxjs/operators';
import { HttpTestingController } from '@angular/common/http/testing';
import { User } from '@models/user';
import { cloneDeep } from 'lodash';
import { Subject } from 'rxjs';
import { AuthService } from 'app/auth/auth.service';
import { SocketMock } from 'app/../types/socketio-mock';
import { WebSocketService } from './web-socket.service';
import MockedServerSocket from 'socket.io-mock';
import { reviveDates } from 'app/shared/utils';
import { externalMockedUsers } from '../mocked-data/mocked-users';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);

  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedUsers: User[], done: DoneFn) => void) => {
    it(name, (done: DoneFn) => {
      service
        .getUsers()
        .pipe(take(2), last())
        .subscribe((users) => {
          const expectedUsers = reviveDates(mockedUsers);
          expect(users.length).toBe(3);
          expect(users).toEqual(expectedUsers);
          test(expectedUsers, done);
        });
      const req = httpMock.expectOne('/api/user/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedUsers);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue(undefined);
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedUsers = cloneDeep(externalMockedUsers);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('refreshCurrentUser should work', (done: DoneFn) => {
    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last());
    // No current user
    test1.subscribe((user) => {
      expect(user).toEqual(new User());
    });
    // Set current user
    authServiceSpy.userEmail.and.returnValue(externalMockedUsers[1].email);
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(reviveDates(mockedUsers[1]));
      done();
    });
    // mock response
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  baseTest('getUser should work', (expectedUsers: User[], done: DoneFn) => {
    service
      .getUser(externalMockedUsers[0].email)
      .pipe(
        take(2),
        last(),
        mergeMap((user) => {
          expect(user).toBeTruthy();
          expect(user).toEqual(reviveDates(mockedUsers[0]));
          return service.getUser('inexistentMockedUser@mocked.com').pipe(take(2), last());
        })
      )
      .subscribe((user) => {
        expect(user).toBe(undefined);
      });

    setTimeout(() => {
      done();
    }, 100);
  });

  baseTest('getUsers should work', (expectdUsers: User[], done: DoneFn) => done());

  baseTest('getUsersList should work', (expectdUsers: User[], done: DoneFn) => {
    expect(service.getUsersList()).toEqual(reviveDates(mockedUsers));
    expect(expectdUsers).toEqual(reviveDates(mockedUsers));
    done();
  });

  it('updateUser should work without change current user', (done: DoneFn) => {
    const data = {
      ns: {
        coll: 'users',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { fullName: 'Test works' },
        removedFields: [] as any[],
      },
    };
    const editedUser = cloneDeep(mockedUsers[1]);
    editedUser.fullName = 'Test works';
    let i = 1;
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last());

    // No current user
    test1.subscribe((user) => {
      expect(user).toEqual(new User());
    });

    // Set current user
    authServiceSpy.userEmail.and.returnValue(externalMockedUsers[1].email);
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(reviveDates(mockedUsers[1]));
      service
        .getUsers()
        .pipe(take(2))
        .subscribe((users) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(users).toEqual(reviveDates(mockedUsers));
              const cb = jasmine.createSpy().and.returnValue('test');
              service.updateUser(editedUser, cb, false);
              const req1 = httpMock.expectOne('/api/user/update');
              expect(req1.request.method).toBe('POST');
              req1.flush(null);
              expect(cb).not.toHaveBeenCalled();
              socket.emit('dbchange', data);
              break;
            }
            case 2: {
              expect(users[1].fullName).toEqual('Test works');
              expect(user).toEqual(mockedUsers[1]);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
    });
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  it('updateUser should work changing current user without callback', (done: DoneFn) => {
    const data = {
      ns: {
        coll: 'users',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { fullName: 'Test works' },
        removedFields: [] as any[],
      },
    };
    const editedUser = cloneDeep(mockedUsers[1]);
    editedUser.fullName = 'Test works';
    let i = 1;
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last());

    // No current user
    test1.subscribe((user) => {
      expect(user).toEqual(new User());
    });

    // Set current user
    authServiceSpy.userEmail.and.returnValue(externalMockedUsers[1].email);
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(reviveDates(mockedUsers[1]));
      service
        .getUsers()
        .pipe(take(2))
        .subscribe((users) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(users).toEqual(reviveDates(mockedUsers));
              service.updateUser(editedUser, undefined, true);
              const req1 = httpMock.expectOne('/api/user/update');
              expect(req1.request.method).toBe('POST');
              req1.flush(null);
              socket.emit('dbchange', data);
              break;
            }
            case 2: {
              expect(users[1].fullName).toEqual('Test works');
              service.currentUser$.pipe(take(1)).subscribe((finalUser) => {
                expect(finalUser).not.toEqual(mockedUsers[1]);
                expect(reviveDates(finalUser)).toEqual(reviveDates(editedUser));
                done();
              });
              break;
            }
            default: {
              break;
            }
          }
        });
    });
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  it('updateUser should work changing current user with callback', (done: DoneFn) => {
    const data = {
      ns: {
        coll: 'users',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { fullName: 'Test works' },
        removedFields: [] as any[],
      },
    };
    const editedUser = cloneDeep(mockedUsers[1]);
    editedUser.fullName = 'Test works';
    let i = 1;
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last());

    // No current user
    test1.subscribe((user) => {
      expect(user).toEqual(new User());
    });

    // Set current user
    authServiceSpy.userEmail.and.returnValue(externalMockedUsers[1].email);
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(reviveDates(mockedUsers[1]));
      service
        .getUsers()
        .pipe(take(2))
        .subscribe((users) => {
          switch (i) {
            case 1: {
              jasmine.clock().uninstall();
              i += 1;
              expect(users).toEqual(reviveDates(mockedUsers));
              const cb = jasmine.createSpy('test');
              service.updateUser(editedUser, cb, true);
              const req1 = httpMock.expectOne('/api/user/update');
              expect(req1.request.method).toBe('POST');
              jasmine.clock().install();
              req1.flush(null);
              jasmine.clock().tick(110);
              expect(cb.calls.any()).toBe(true);
              socket.emit('dbchange', data);
              jasmine.clock().uninstall();
              break;
            }
            case 2: {
              expect(users[1].fullName).toEqual(editedUser.fullName);
              expect(user).not.toEqual(users[1]);
              service.currentUser$.pipe(take(1)).subscribe((finalUser) => {
                expect(reviveDates(finalUser)).toEqual(reviveDates(editedUser));
                done();
              });
              break;
            }
            default: {
              break;
            }
          }
        });
    });
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  baseTest('idToShortName should work', (expectedUsers: User[], done: DoneFn) => {
    expect(expectedUsers).toEqual(reviveDates(mockedUsers));
    expect(service.idToShortName('0')).toBe(mockedUsers[0].fullName);
    expect(service.idToShortName(mockedUsers[0])).toBe(mockedUsers[0].fullName);
    expect(service.idToShortName('000000000000000000000000')).toBe('Caixa do contrato');
    done();
  });

  baseTest('idToUser should work', (expectedUsers: User[], done: DoneFn) => {
    expect(expectedUsers).toEqual(reviveDates(mockedUsers));
    expect(service.idToUser('0')).toEqual(reviveDates(mockedUsers[0]));
    expect(service.idToUser(mockedUsers[0])).toEqual(mockedUsers[0]);
    expect(service.idToUser('000000000000000000000000')).toEqual(CONTRACT_BALANCE as User);
    done();
  });

  baseTest('isEqual should work', (expectedUsers: User[], done: DoneFn) => {
    expect(expectedUsers).toEqual(reviveDates(mockedUsers));
    expect(service.isEqual(undefined, undefined)).toBe(false);
    expect(service.isEqual(undefined, '0')).toBe(false);
    expect(service.isEqual('0', undefined)).toBe(false);
    expect(service.isEqual(mockedUsers[0], '0')).toBe(true);
    expect(service.isEqual('1', mockedUsers[1])).toBe(true);
    expect(service.isEqual('000000000000000000000000', CONTRACT_BALANCE as User)).toBe(true);
    done();
  });
});
