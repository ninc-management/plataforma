import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';
import { cloneDeep } from 'lodash';
import { of, Subject, take } from 'rxjs';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';

import { externalMockedCompanies } from '../mocked-data/mocked-companies';
import { externalMockedInvoices } from '../mocked-data/mocked-invoices';
import { externalMockedTeams } from '../mocked-data/mocked-teams';
import { externalMockedUsers } from '../mocked-data/mocked-users';
import { NotificationBody, NotificationService } from './notification.service';
import { UserService } from './user.service';
import { WebSocketService } from './web-socket.service';
import { AuthService } from 'app/auth/auth.service';
import { reviveDates } from 'app/shared/utils';

import { Invoice } from '@models/invoice';
import { Notification } from '@models/notification';
import { Team } from '@models/team';
import { User } from '@models/user';

describe('NotificationService', () => {
  let service: NotificationService;
  let userService: UserService;
  let httpMock: HttpTestingController;
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
    isCompanyLoaded$: of(true),
    companyId: externalMockedCompanies[0]._id,
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);

  let mockedUsers: User[];
  let mockedInvoices: Invoice[];
  let mockedTeams: Team[];

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue(externalMockedUsers[0].email);
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    userService = TestBed.inject(UserService);

    mockedUsers = cloneDeep(externalMockedUsers);
    mockedInvoices = cloneDeep(externalMockedInvoices);
    mockedTeams = cloneDeep(externalMockedTeams);

    userService.getUsers().pipe(take(1)).subscribe();
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedUsers);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('notify should work', (done: DoneFn) => {
    const notificationBody = { title: 'Title 1', tag: 'T1', message: 'Message 1' } as NotificationBody;
    const notification = new Notification();
    notification.title = notificationBody.title;
    notification.message = notificationBody.message;
    notification.from = mockedUsers[0]._id;
    notification.to = mockedUsers[1]._id;

    const data = {
      ns: {
        coll: 'users',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { 'notifications.1': notification },
        removedFields: [] as any[],
      },
    };

    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    let i = 1;

    userService
      .getUsers()
      .pipe(take(2))
      .subscribe((users) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(users).toEqual(reviveDates(mockedUsers));
            service.notify(notification.to, notificationBody);
            socket.emit('dbchange', data);
            const req = httpMock.expectOne('/api/notify/');
            expect(req.request.method).toBe('POST');
            req.flush(null);
            break;
          }
          case 2: {
            const expectedNotifications = reviveDates([notification]);
            expect(users[1].notifications).toEqual(expectedNotifications);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
  });

  it('notifyMany invoice team members should work', (done: DoneFn) => {
    const notificationBody = {
      title: 'Title Many - Users',
      tag: 'T-M',
      message: 'Message Many',
    };

    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    let i = 1;
    let req: TestRequest;

    userService
      .getUsers()
      .pipe(take(3))
      .subscribe((users) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(users).toEqual(reviveDates(mockedUsers));
            service.notifyMany(mockedInvoices[0].team, notificationBody);
            req = httpMock.expectOne('/api/notify/many');
            expect(req.request.method).toBe('POST');
            req.flush(null);
            socket.emit('dbchange', {
              ns: {
                coll: 'users',
              },
              operationType: 'update',
              documentKey: {
                _id: '0',
              },
              updateDescription: {
                updatedFields: { 'notifications.1': req.request.body.notifications[0] },
                removedFields: [] as any[],
              },
            });
            break;
          }
          case 2: {
            i += 1;
            socket.emit('dbchange', {
              ns: {
                coll: 'users',
              },
              operationType: 'update',
              documentKey: {
                _id: '1',
              },
              updateDescription: {
                updatedFields: { 'notifications.1': req.request.body.notifications[1] },
                removedFields: [] as any[],
              },
            });
            break;
          }
          case 3: {
            const expectedNotifications = reviveDates(req.request.body.notifications);
            expect(users[0].notifications).toEqual([expectedNotifications[0]]);
            expect(users[1].notifications).toEqual([expectedNotifications[1]]);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
  });

  it('notifyMany team members should work', (done: DoneFn) => {
    const notificationBody = {
      title: 'Title Many - Users',
      tag: 'T-M',
      message: 'Message Many',
    };

    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    let i = 1;
    let req: TestRequest;

    userService
      .getUsers()
      .pipe(take(3))
      .subscribe((users) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(users).toEqual(reviveDates(mockedUsers));
            service.notifyMany(mockedTeams[0].members, notificationBody);
            req = httpMock.expectOne('/api/notify/many');
            expect(req.request.method).toBe('POST');
            req.flush(null);
            socket.emit('dbchange', {
              ns: {
                coll: 'users',
              },
              operationType: 'update',
              documentKey: {
                _id: '0',
              },
              updateDescription: {
                updatedFields: { 'notifications.1': req.request.body.notifications[0] },
                removedFields: [] as any[],
              },
            });
            break;
          }
          case 2: {
            i += 1;
            socket.emit('dbchange', {
              ns: {
                coll: 'users',
              },
              operationType: 'update',
              documentKey: {
                _id: '1',
              },
              updateDescription: {
                updatedFields: { 'notifications.1': req.request.body.notifications[1] },
                removedFields: [] as any[],
              },
            });
            break;
          }
          case 3: {
            const expectedNotifications = reviveDates(req.request.body.notifications);
            expect(users[0].notifications).toEqual([expectedNotifications[0]]);
            expect(users[1].notifications).toEqual([expectedNotifications[1]]);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
  });

  it('notifyMany users should work', (done: DoneFn) => {
    const notificationBody = {
      title: 'Title Many - Users',
      tag: 'T-M',
      message: 'Message Many',
    };

    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    let i = 1;
    let req: TestRequest;

    userService
      .getUsers()
      .pipe(take(3))
      .subscribe((users) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(users).toEqual(reviveDates(mockedUsers));
            service.notifyMany(mockedUsers, notificationBody);
            req = httpMock.expectOne('/api/notify/many');
            expect(req.request.method).toBe('POST');
            req.flush(null);
            socket.emit('dbchange', {
              ns: {
                coll: 'users',
              },
              operationType: 'update',
              documentKey: {
                _id: '0',
              },
              updateDescription: {
                updatedFields: { 'notifications.1': req.request.body.notifications[0] },
                removedFields: [] as any[],
              },
            });
            break;
          }
          case 2: {
            i += 1;
            socket.emit('dbchange', {
              ns: {
                coll: 'users',
              },
              operationType: 'update',
              documentKey: {
                _id: '1',
              },
              updateDescription: {
                updatedFields: { 'notifications.1': req.request.body.notifications[1] },
                removedFields: [] as any[],
              },
            });
            break;
          }
          case 3: {
            const expectedNotifications = reviveDates(req.request.body.notifications);
            expect(users[0].notifications).toEqual([expectedNotifications[0]]);
            expect(users[1].notifications).toEqual([expectedNotifications[1]]);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
  });

  it('checkNotification should work', (done: DoneFn) => {
    const notificationBody = {
      title: 'Title',
      tag: 'T',
      message: 'Message',
    };

    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    let i = 1;
    let req: TestRequest;

    userService
      .getUsers()
      .pipe(take(3))
      .subscribe((users) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(users).toEqual(reviveDates(mockedUsers));
            service.notifyMany(mockedUsers, notificationBody);
            req = httpMock.expectOne('/api/notify/many');
            expect(req.request.method).toBe('POST');
            req.flush(null);
            socket.emit('dbchange', {
              ns: {
                coll: 'users',
              },
              operationType: 'update',
              documentKey: {
                _id: '0',
              },
              updateDescription: {
                updatedFields: { 'notifications.1': req.request.body.notifications[0] },
                removedFields: [] as any[],
              },
            });
            break;
          }
          case 2: {
            i += 1;
            const expectedNotifications = reviveDates(req.request.body.notifications);
            expect(users[0].notifications[0]).toEqual(expectedNotifications[0]);
            service.checkNotification(expectedNotifications[0]);
            req = httpMock.expectOne('/api/notify/read');
            expect(req.request.method).toBe('POST');
            req.flush(null);
            socket.emit('dbchange', {
              ns: {
                coll: 'users',
              },
              operationType: 'update',
              documentKey: {
                _id: '0',
              },
              updateDescription: {
                updatedFields: { notifications: [] },
                removedFields: [] as any[],
              },
            });
            break;
          }
          case 3: {
            expect(users[0].notifications.length).toBe(0);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
  });
});
