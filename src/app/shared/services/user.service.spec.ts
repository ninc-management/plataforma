import { TestBed } from '@angular/core/testing';

import { UserService, CONTRACT_BALANCE } from './user.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { last, take, publish } from 'rxjs/operators';
import { HttpTestingController } from '@angular/common/http/testing';
import { User } from '../../../../backend/src/models/user';
import { cloneDeep } from 'lodash';
import { ConnectableObservable, Subject, Observable } from 'rxjs';
import { AuthService } from 'app/auth/auth.service';
import { SocketMock } from 'app/../types/socketio-mock';
import MockedServerSocket from 'socket.io-mock';
import { Socket } from 'ngx-socket-io';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>(
    'AuthService',
    ['userEmail'],
    { onUserChange$: new Subject<void>() }
  );
  const socketServiceSpy = jasmine.createSpyObj<Socket>('Socket', [
    'fromEvent',
  ]);

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(Socket, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue(undefined);
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedUsers = [];
    const tmp = new User();
    tmp._id = '0';
    tmp.fullName = 'Test1';
    tmp.email = 'test1@te.st';
    tmp.phone = '123456';
    mockedUsers.push(cloneDeep(tmp));
    tmp._id = '1';
    tmp.fullName = 'Test2';
    tmp.email = 'test2@te.st';
    tmp.phone = '123456';
    mockedUsers.push(cloneDeep(tmp));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('refreshCurrentUser should work', (done: DoneFn) => {
    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last(), publish());
    // No current user
    test1.subscribe(
      (user) => {
        expect(user).toEqual(new User());
      },
      undefined,
      (test2 as ConnectableObservable<User>).connect.bind(test2)
    );
    // Set current user
    authServiceSpy.userEmail.and.returnValue('test2@te.st');
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(mockedUsers[1]);
      done();
    });
    // mock response
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  it('getUser should work', (done: DoneFn) => {
    const test1 = service.getUser('test1@te.st').pipe(take(2), last());
    const test2 = service.getUser('test3@te.st').pipe(take(1), publish());

    test1.subscribe(
      (user) => {
        expect(user).toBeTruthy();
        expect(user).toEqual(mockedUsers[0]);
      },
      undefined,
      (test2 as ConnectableObservable<User | undefined>).connect.bind(test2)
    );
    // Test2 only is executed after test 1 completes due to publish() method
    test2.subscribe((user) => {
      expect(user).toBe(undefined);
      done();
    });

    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  it('getUsers should work', (done: DoneFn) => {
    service
      .getUsers()
      .pipe(take(2), last())
      .subscribe((users) => {
        expect(users.length).toBe(2);
        expect(users).toEqual(mockedUsers);
        done();
      });
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  it('getUsersList should work', (done: DoneFn) => {
    service
      .getUsers()
      .pipe(take(2), last())
      .subscribe((users) => {
        expect(service.getUsersList()).toEqual(mockedUsers);
        expect(service.getUsersList()).toEqual(users);
        done();
      });
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
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
    const test2 = service.currentUser$.pipe(take(2), last(), publish());

    // No current user
    test1.subscribe(
      (user) => {
        expect(user).toEqual(new User());
      },
      undefined,
      (test2 as ConnectableObservable<User>).connect.bind(test2)
    );

    // Set current user
    authServiceSpy.userEmail.and.returnValue('test2@te.st');
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(mockedUsers[1]);
      service
        .getUsers()
        .pipe(take(2))
        .subscribe((users) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(users).toEqual(mockedUsers);
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
              expect(user).not.toEqual(mockedUsers[1]);
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
    const test2 = service.currentUser$.pipe(take(2), last(), publish());

    // No current user
    test1.subscribe(
      (user) => {
        expect(user).toEqual(new User());
      },
      undefined,
      (test2 as ConnectableObservable<User>).connect.bind(test2)
    );

    // Set current user
    authServiceSpy.userEmail.and.returnValue('test2@te.st');
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(mockedUsers[1]);
      service
        .getUsers()
        .pipe(take(2))
        .subscribe((users) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(users).toEqual(mockedUsers);
              service.updateUser(editedUser, undefined, true);
              const req1 = httpMock.expectOne('/api/user/update');
              expect(req1.request.method).toBe('POST');
              req1.flush(null);
              socket.emit('dbchange', data);
              break;
            }
            case 2: {
              expect(users[1].fullName).toEqual('Test works');
              expect(user).not.toEqual(mockedUsers[1]);
              service.currentUser$.pipe(take(1)).subscribe((finalUser) => {
                expect(finalUser).toEqual(mockedUsers[1]);
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
    const test2 = service.currentUser$.pipe(take(2), last(), publish());

    // No current user
    test1.subscribe(
      (user) => {
        expect(user).toEqual(new User());
      },
      undefined,
      (test2 as ConnectableObservable<User>).connect.bind(test2)
    );

    // Set current user
    authServiceSpy.userEmail.and.returnValue('test2@te.st');
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(mockedUsers[1]);
      service
        .getUsers()
        .pipe(take(2))
        .subscribe((users) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(users).toEqual(mockedUsers);
              const cb = jasmine.createSpy('test');
              service.updateUser(editedUser, cb, true);
              const req1 = httpMock.expectOne('/api/user/update');
              expect(req1.request.method).toBe('POST');
              req1.flush(null);
              expect(cb.calls.any()).toBe(true);
              socket.emit('dbchange', data);
              break;
            }
            case 2: {
              expect(users[1].fullName).toEqual(editedUser.fullName);
              expect(user).not.toEqual(users[1]);
              service.currentUser$.pipe(take(1)).subscribe((finalUser) => {
                expect(finalUser).toEqual(mockedUsers[1]);
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

  it('idToName should work', (done: DoneFn) => {
    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last(), publish());
    // No current user
    test1.subscribe(
      (user) => {
        expect(user).toEqual(new User());
      },
      undefined,
      (test2 as ConnectableObservable<User>).connect.bind(test2)
    );
    // Set current user
    authServiceSpy.userEmail.and.returnValue('test2@te.st');
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(mockedUsers[1]);
      expect(service.idToName('0')).toEqual(mockedUsers[0].fullName);
      expect(service.idToName(mockedUsers[0])).toEqual(mockedUsers[0].fullName);
      expect(service.idToName(undefined)).toEqual('');
      expect(service.idToName('000000000000000000000000')).toEqual(
        'Caixa do contrato'
      );
      done();
    });
    // mock response
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  it('idToShortName should work', (done: DoneFn) => {
    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last(), publish());
    // No current user
    test1.subscribe(
      (user) => {
        expect(user).toEqual(new User());
      },
      undefined,
      (test2 as ConnectableObservable<User>).connect.bind(test2)
    );
    // Set current user
    authServiceSpy.userEmail.and.returnValue('test2@te.st');
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(mockedUsers[1]);
      expect(service.idToShortName('0')).toEqual(mockedUsers[0].fullName);
      expect(service.idToShortName(mockedUsers[0])).toEqual(
        mockedUsers[0].fullName
      );
      expect(service.idToShortName('000000000000000000000000')).toEqual(
        'Caixa do contrato'
      );
      done();
    });
    // mock response
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  it('idToUser should work', (done: DoneFn) => {
    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last(), publish());
    // No current user
    test1.subscribe(
      (user) => {
        expect(user).toEqual(new User());
      },
      undefined,
      (test2 as ConnectableObservable<User>).connect.bind(test2)
    );
    // Set current user
    authServiceSpy.userEmail.and.returnValue('test2@te.st');
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(mockedUsers[1]);
      expect(service.idToUser('0')).toEqual(mockedUsers[0]);
      expect(service.idToUser(mockedUsers[0])).toEqual(mockedUsers[0]);
      expect(service.idToUser('000000000000000000000000')).toEqual(
        CONTRACT_BALANCE as User
      );
      done();
    });
    // mock response
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  it('isEqual should work', (done: DoneFn) => {
    const test1 = service.currentUser$.pipe(take(1));
    const test2 = service.currentUser$.pipe(take(2), last(), publish());
    // No current user
    test1.subscribe(
      (user) => {
        expect(user).toEqual(new User());
      },
      undefined,
      (test2 as ConnectableObservable<User>).connect.bind(test2)
    );
    // Set current user
    authServiceSpy.userEmail.and.returnValue('test2@te.st');
    service.refreshCurrentUser();
    test2.subscribe((user) => {
      expect(user).toEqual(mockedUsers[1]);
      expect(service.isEqual(undefined, undefined)).toBe(false);
      expect(service.isEqual(undefined, '0')).toBe(false);
      expect(service.isEqual('0', undefined)).toBe(false);
      expect(service.isEqual(mockedUsers[0], '0')).toBe(true);
      expect(service.isEqual('1', mockedUsers[1])).toBe(true);
      expect(
        service.isEqual('000000000000000000000000', CONTRACT_BALANCE as User)
      ).toBe(true);
      done();
    });
    // mock response
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });
});
