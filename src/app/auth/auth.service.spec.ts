import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { Ref } from '@typegoose/typegoose';
import { CommonTestingModule } from 'app/../common-testing.module';
import { cloneDeep } from 'lodash';
import { Subject } from 'rxjs';
import { last, take } from 'rxjs/operators';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';

import { AuthService } from './auth.service';
import { externalMockedUsers } from 'app/shared/mocked-data/mocked-users';
import { ProspectService } from 'app/shared/services/prospect.service';
import { WebSocketService } from 'app/shared/services/web-socket.service';

import { Company } from '@models/company';
import { Prospect } from '@models/prospect';
import { User } from '@models/user';

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let prospectService: ProspectService;
  let service: AuthService;
  let mockedUsers: User[];
  let mockedProspects: Prospect[];
  let account: AccountInfo;
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
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
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
    prospectService = TestBed.inject(ProspectService);
    mockedUsers = cloneDeep(externalMockedUsers);
    account = {
      homeAccountId: mockedUsers[0]._id,
      environment: '',
      tenantId: mockedUsers[0]._id,
      name: mockedUsers[0].fullName,
      username: mockedUsers[0].email,
      localAccountId: mockedUsers[0]._id,
    };
    mockedProspects = [];
    const tmpProspect = new Prospect();
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
    instanceSpy.getAllAccounts.and.returnValue([account]);
    instanceSpy.getActiveAccount.and.returnValue(account);
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
    }, 100);
  });

  it('isUserProspect should work', (done: DoneFn) => {
    service.isUserProspect(mockedUsers[0].email).subscribe((isProspect) => {
      expect(isProspect).toBe(false);
    });
    const req = httpMock.expectOne('/api/auth/isProspect');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(!!mockedProspects.find((prospect: Prospect) => prospect.email == mockedUsers[0].email));
    }, 50);
    service.isUserProspect(mockedProspects[0].email).subscribe((isProspect) => {
      expect(isProspect).toBe(true);
      done();
    });
    const req1 = httpMock.expectOne('/api/auth/isProspect');
    expect(req1.request.method).toBe('POST');
    setTimeout(() => {
      req1.flush(!!mockedProspects.find((prospect: Prospect) => prospect.email == mockedProspects[0].email));
    }, 100);
  });

  it('isUserActive should work', (done: DoneFn) => {
    service.isUserActive(mockedUsers[3].email).subscribe((response) => {
      expect(response).toBe(false);
    });
    const req = httpMock.expectOne('/api/auth/isActive');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(!!mockedUsers.find((user) => user.email == mockedUsers[3].email && user.active));
    }, 50);
    service.isUserActive(mockedUsers[0].email).subscribe((response) => {
      expect(response).toBe(true);
      done();
    });
    const req2 = httpMock.expectOne('/api/auth/isActive');
    expect(req2.request.method).toBe('POST');
    setTimeout(() => {
      req2.flush(!!mockedUsers.find((user) => user.email == mockedUsers[0].email && user.active));
    }, 100);
  });

  it('getCompany should work', (done: DoneFn) => {
    // No accounts
    instanceSpy.getAllAccounts.and.returnValue([]);
    instanceSpy.getActiveAccount.and.returnValue(null);
    const test1 = service.isCompanyLoaded$.pipe(take(1));
    const test2 = service.isCompanyLoaded$.pipe(take(1));
    test1.subscribe((isCompanyLoaded) => {
      expect(isCompanyLoaded).toBe(false);
      expect(service.companyId as Ref<Company>).toBe('');
    });
    // Set active account
    instanceSpy.getAllAccounts.and.returnValue([account]);
    instanceSpy.getActiveAccount.and.returnValue(account);
    service.getCompany();
    const req = httpMock.expectOne('/api/auth/id');
    expect(req.request.method).toBe('POST');
    req.flush(mockedUsers[0].company ? mockedUsers[0].company : '');
    test2.subscribe((isCompanyLoaded) => {
      expect(isCompanyLoaded).toBe(true);
      expect(service.companyId as Ref<Company>).toBe(mockedUsers[0].company);
      done();
    });
  });
});
