import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { IPublicClientApplication } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';
import { Subject } from 'rxjs';
import { WebSocketService } from 'app/shared/services/web-socket.service';
import { ProspectService } from 'app/shared/services/prospect.service';
import { Prospect } from '@models/prospect';
import { User } from '@models/user';

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let prospectService: ProspectService;
  let service: AuthService;
  let mockedUsers: User[];
  let mockedProspects: Prospect[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const instanceSpy = jasmine.createSpyObj<IPublicClientApplication>('IPublicClientApplication', [
    'getAllAccounts',
    'getActiveAccount',
    'setActiveAccount',
    'loginPopup',
  ]);
  const msAuthServiceSpy = jasmine.createSpyObj<MsalService>('MsalService', [], {
    instance: instanceSpy,
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('Socket', ['fromEvent']);

  CommonTestingModule.setUpTestBed();
  beforeEach(() => {
    TestBed.overrideProvider(MsalService, { useValue: msAuthServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
    prospectService = TestBed.inject(ProspectService);

    mockedUsers = [];
    mockedProspects = [];

    const tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.fullName = 'user';
    tmpUser.email = 'user@mocked.com';
    tmpUser.phone = '00000000000';
    tmpUser.active = false;
    mockedUsers.push(cloneDeep(tmpUser));
    tmpUser._id = '1';
    tmpUser.fullName = 'user2';
    tmpUser.email = 'user2@mocked.com';
    tmpUser.phone = '00000000000';
    tmpUser.active = true;
    mockedUsers.push(cloneDeep(tmpUser));

    let tmpProspect = new Prospect();
    tmpProspect._id = '0';
    tmpProspect.fullName = 'prospect';
    tmpProspect.email = 'prospect@mocked.com';
    tmpProspect.phone = '00000000000';

    mockedProspects.push(cloneDeep(tmpProspect));
    tmpProspect._id = '1';
    tmpProspect.fullName = 'prospect2';
    tmpProspect.email = 'prospect2@mocked.com';
    tmpProspect.phone = '00000000000';

    mockedProspects.push(cloneDeep(tmpProspect));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('userEmail should work', () => {
    instanceSpy.getAllAccounts.and.returnValue([
      {
        homeAccountId: mockedUsers[0]._id,
        environment: '',
        tenantId: mockedUsers[0]._id,
        name: mockedUsers[0].fullName,
        username: mockedUsers[0].email,
        localAccountId: mockedUsers[0]._id,
      },
      {
        homeAccountId: mockedUsers[1]._id,
        environment: '',
        tenantId: mockedUsers[1]._id,
        name: mockedUsers[1].fullName,
        username: mockedUsers[1].email,
        localAccountId: mockedUsers[1]._id,
      },
    ]);
    instanceSpy.getActiveAccount.and.returnValue({
      homeAccountId: mockedUsers[0]._id,
      environment: '',
      tenantId: mockedUsers[0]._id,
      name: mockedUsers[0].fullName,
      username: mockedUsers[0].email,
      localAccountId: mockedUsers[0]._id,
    });
    expect(service.userEmail()).toBe(mockedUsers[0].email);
  });

  it('register should work', (done: DoneFn) => {
    const newMockedProspect = new Prospect();
    newMockedProspect._id = '2';
    newMockedProspect.fullName = 'josé';
    newMockedProspect.email = 'test1@te.st';
    newMockedProspect.phone = '123456';
    let i = 1;
    const data = {
      ns: {
        coll: 'prospects',
      },
      operationType: 'insert',
      fullDocument: newMockedProspect,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));
    prospectService
      .getProspects()
      .pipe(take(3))
      .subscribe((prospects: Prospect[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(prospects.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(prospects.length).toBe(2);
            expect(prospects).toEqual(mockedProspects);
            service.register(newMockedProspect).subscribe();
            const req1 = httpMock.expectOne('/api/auth/register');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(prospects.length).toBe(3);
            mockedProspects.push(newMockedProspect);
            expect(prospects).toEqual(mockedProspects);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    // mock response
    const req = httpMock.expectOne('/api/user/allProspects');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedProspects);
    }, 50);
  });

  it('isUserRegistred should work', (done: DoneFn) => {
    service.isUserRegistred('fakeUser@mocked.com').subscribe((response) => {
      expect(response).toBe(false);
    });
    const req = httpMock.expectOne('/api/auth/isRegistered');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(!!mockedUsers.find((user: User) => user.email == 'fakeUser@mocked.com'));
    }, 50);
    service.isUserRegistred(mockedUsers[0].email).subscribe((response) => {
      expect(response).toBe(true);
      done();
    });
    const req1 = httpMock.expectOne('/api/auth/isRegistered');
    expect(req1.request.method).toBe('POST');
    setTimeout(() => {
      req1.flush(!!mockedUsers.find((user: User) => user.email == mockedUsers[0].email));
    }, 50);
  });

  it('isUserProspect should work', (done: DoneFn) => {
    service.isUserProspect('fakeProspect@mocked.com').subscribe((isProspect) => {
      expect(isProspect).toBe(false);
    });
    const req = httpMock.expectOne('/api/auth/isProspect');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(!!(mockedProspects.find((prospect: Prospect) => prospect.email == 'fakeProspect@mocked.com')));
    }, 50);

    service.isUserProspect(mockedProspects[0].email).subscribe((isProspect) => {
      expect(isProspect).toBe(true);
      done();
    });

     const req1 = httpMock.expectOne('/api/auth/isProspect');
     expect(req1.request.method).toBe('POST');
     setTimeout(() => {
       req1.flush(!!mockedProspects.find((prospect: Prospect) => prospect.email == mockedProspects[0].email));
     }, 50);
  });

  it('isUserActive should work', (done: DoneFn) => {
    service.isUserActive('fakeUser@mocked.com').subscribe((response) => {
      expect(response).toBe(false);
    });
    const req = httpMock.expectOne('api/auth/isActive');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(!!mockedUsers.find((user) => user.email == 'fakeUser@mocked.com' && user.active));
    }, 50);

    service.isUserActive(mockedUsers[0].email).subscribe((response) => {
      expect(response).toBe(false);
    });

    const req1 = httpMock.expectOne('api/auth/isActive');
    expect(req1.request.method).toBe('POST');
    setTimeout(() => {
      req1.flush(!!mockedUsers.find((user) => user.email == 'user@mocked.com' && user.active));
    }, 50);

    service.isUserActive(mockedUsers[1].email).subscribe((response) => {
      expect(response).toBe(true);
      done();
    });

    const req2 = httpMock.expectOne('api/auth/isActive');
    expect(req2.request.method).toBe('POST');
    setTimeout(() => {
      req2.flush(!!mockedUsers.find((user) => user.email == mockedUsers[0].email && user.active));
    }, 50);
  });
});
