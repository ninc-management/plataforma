import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';
import { Subject, take } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';
import MockedServerSocket from 'socket.io-mock';
import { ProspectService } from './prospect.service';
import { AuthService } from 'app/auth/auth.service';

import { Prospect } from '@models/prospect';
import { cloneDeep } from 'lodash';
import { UserService } from './user.service';
import { User } from '@models/user';
import { WebSocketService } from './web-socket.service';

describe('ProspectService', () => {
  let service: ProspectService;
  let userService: UserService;
  let httpMock: HttpTestingController;
  let mockedProspects: Prospect[];
  let mockedUsers: User[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);
  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedProspects: Prospect[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;
      service
        .getProspects()
        .pipe(take(2))
        .subscribe((prospects) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(prospects.length).toBe(0);
              break;
            }
            case 2: {
              const expectedProspects = mockedProspects;
              expect(prospects.length).toBe(2);
              expect(prospects).toEqual(expectedProspects);
              test(expectedProspects);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });

      const req = httpMock.expectOne('/api/user/allProspects');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedProspects);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ProspectService);
    userService = TestBed.inject(UserService);

    mockedProspects = [];
    mockedUsers = [];

    const tmpProspect = new Prospect();
    tmpProspect._id = '0';
    tmpProspect.name = 'ProspectTest1';
    tmpProspect.email = 'test1@te.st';
    tmpProspect.phone = '123456';

    mockedProspects.push(cloneDeep(tmpProspect));

    tmpProspect._id = '1';
    tmpProspect.name = 'ProspectTest2';
    tmpProspect.email = 'test2@te.st';
    tmpProspect.phone = '1234567';

    mockedProspects.push(cloneDeep(tmpProspect));

    const tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.name = 'UserTest';
    tmpUser.email = 'uTest1@te.st';
    tmpUser.phone = '12345678';

    mockedUsers.push(cloneDeep(tmpUser));

    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedUsers);
    }, 50);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  baseTest('getProspects should work', (expectedProspects: Prospect[]) => {});

  it('approveProspect should work', (done: DoneFn) => {
    const approvedProspect = cloneDeep(mockedProspects[0]);

    const data = {
      ns: {
        coll: 'prospects',
      },
      operationType: 'delete',
      documentKey: {
        _id: '0',
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    let i = 1;
    service
      .getProspects()
      .pipe(take(3))
      .subscribe((prospects) => {
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
            service.approveProspect(approvedProspect);

            const req = httpMock.expectOne('/api/user/approveProspect');
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
            socket.emit('dbchange', data);
            break;
          }

          case 3: {
            expect(prospects.length).toBe(1);
            mockedProspects = mockedProspects.filter((prospect) => prospect._id != '0');
            expect(prospects).toEqual(mockedProspects);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    const allProspectsReq = httpMock.expectOne('/api/user/allProspects');
    expect(allProspectsReq.request.method).toBe('POST');
    setTimeout(() => {
      allProspectsReq.flush(mockedProspects);
    }, 50);

    let k = 1;
    userService
      .getUsers()
      .pipe(take(2))
      .subscribe((users) => {
        switch (k) {
          case 1: {
            k += 1;
            expect(users.length).toBe(0);
            break;
          }
          case 2: {
            k += 1;
            expect(users.length).toBe(mockedUsers.length);
            break;
          }
          case 3: {
            expect(users.length).toBe(mockedUsers.length + 1);
            expect(users[users.length - 1]).toBe(approvedProspect);
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
