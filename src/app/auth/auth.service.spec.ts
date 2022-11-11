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

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let prospectService: ProspectService;
  let service: AuthService;
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

   mockedProspects = [];

    let tmpProspect = new Prospect();
    tmpProspect._id = '0';
    tmpProspect.fullName = 'maria';
    tmpProspect.email = 'test1@te.st';
    tmpProspect.phone = '123456';

    mockedProspects.push(cloneDeep(tmpProspect));
    tmpProspect._id = '1';
    tmpProspect.fullName = 'daniel';
    tmpProspect.email = 'test2@te.st';
    tmpProspect.phone = '1234567';

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
        homeAccountId: '0',
        environment: '',
        tenantId: 'teste',
        username: 'user',
        localAccountId: 'teste',
      },
      {
        homeAccountId: '1',
        environment: '',
        tenantId: 'teste01',
        username: 'user01',
        localAccountId: 'teste01',
      },
    ]);
    instanceSpy.getActiveAccount.and.returnValue({
      homeAccountId: '0',
      environment: '',
      tenantId: 'teste',
      username: 'user',
      localAccountId: 'teste',
    });
    expect(service.userEmail()).toBe('user');
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
    service.isUserRegistred('elygledsonjs@gmail.com').subscribe((flag) => {
      expect(flag).toBe(false);
      done();
    });
    const req = httpMock.expectOne('/api/auth/isRegistered');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(false);
    }, 50);
  });

  it('isUserProspect should work', (done: DoneFn) => {
    service.isUserProspect('elygledsonjs@gmail.com').subscribe((isProspect) => {
      expect(isProspect).toBe(false);
      done();
    });
    const req = httpMock.expectOne('/api/auth/isProspect');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(false);
    }, 50);
  });

  it('isUserActive should work', (done: DoneFn) => {
    service.isUserActive('elygledsonjs@gmail.com').subscribe((isActive) => {
      expect(isActive).toBe(false);
      done();
    });
    const req = httpMock.expectOne('api/auth/isActive');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(false);
    }, 50);
  });
});
