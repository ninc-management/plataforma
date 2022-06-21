import { TestBed } from '@angular/core/testing';

import { NotificationBody, NotificationService } from './notification.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { User } from '@models/user';
import { Notification } from '@models/notification';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { Team, TeamMember } from '@models/team';
import { cloneDeep } from 'lodash';
import { Subject, take } from 'rxjs';
import { UserService } from './user.service';
import { AuthService } from 'app/auth/auth.service';
import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { SocketMock } from 'types/socketio-mock';
import MockedServerSocket from 'socket.io-mock';
import { Socket } from 'ngx-socket-io';
import { reviveDates } from 'app/shared/utils';

describe('NotificationService', () => {
  let service: NotificationService;
  let userService: UserService;
  let httpMock: HttpTestingController;
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<Socket>('Socket', ['fromEvent']);

  let mockedUsers: User[];
  let mockedInvoices: Invoice[];
  let mockedTeams: Team[];

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(Socket, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    userService = TestBed.inject(UserService);
    mockedUsers = [];
    mockedInvoices = [];
    mockedTeams = [];

    const tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.fullName = 'Test';
    tmpUser.email = 'test@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));
    tmpUser._id = '1';
    tmpUser.fullName = 'Test1';
    tmpUser.email = 'test1@te.st';
    mockedUsers.push(cloneDeep(tmpUser));

    const tmpTeam = new Team();
    tmpTeam._id = '0';
    tmpTeam.name = 'test';
    tmpTeam.leader = '0';
    tmpTeam.purpose = 'Be tested';
    tmpTeam.abrev = 'T';
    tmpTeam.config.path = `test`;
    const tmpTeamMember = new TeamMember();
    tmpTeamMember.user = mockedUsers[0]._id;
    tmpTeamMember.sector = '0';
    tmpTeam.members.push(cloneDeep(tmpTeamMember));
    tmpTeamMember.user = mockedUsers[1]._id;
    tmpTeamMember.sector = '1';
    tmpTeam.members.push(cloneDeep(tmpTeamMember));
    mockedTeams.push(cloneDeep(tmpTeam));

    let tmpInvoice = new Invoice();
    tmpInvoice._id = '0';
    tmpInvoice.author = mockedUsers[0]._id;
    tmpInvoice.nortanTeam = '6201b405329f446f16e1b404';
    tmpInvoice.sector = '0';
    tmpInvoice.code = 'ORC-84/2021-NRT/DAD-00';
    tmpInvoice.contractor = '0';
    tmpInvoice.value = '1.000,00';
    const tmpInvoiceMember = new InvoiceTeamMember();
    tmpInvoiceMember.user = mockedUsers[0]._id;
    tmpInvoiceMember.sector = '0';
    tmpInvoice.team.push(cloneDeep(tmpInvoiceMember));
    tmpInvoiceMember.user = mockedUsers[1]._id;
    tmpInvoiceMember.sector = '1';
    tmpInvoice.team.push(cloneDeep(tmpInvoiceMember));
    mockedInvoices.push(cloneDeep(tmpInvoice));

    userService.getUsers().pipe(take(1)).subscribe();
    let req = httpMock.expectOne('/api/user/all');
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
