import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PlatformConfig } from '@models/platformConfig';
import { CommonTestingModule } from 'common-testing.module';
import { Subject, take } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';
import MockedServerSocket from 'socket.io-mock';

import { ConfigService } from './config.service';
import { AuthService } from 'app/auth/auth.service';
import { Socket } from 'ngx-socket-io';
import { ExpenseType } from '@models/team';
import { cloneDeep } from 'lodash';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;
  let mockedConfigs: PlatformConfig[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<Socket>('Socket', ['fromEvent']);
  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedConfigs: PlatformConfig[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getConfig()
        .pipe(take(2))
        .subscribe((configs) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(configs.length).toBe(0);
              break;
            }
            case 2: {
              const expectedConfigs = mockedConfigs;
              expect(configs.length).toBe(1);
              expect(configs).toEqual(expectedConfigs);
              test(expectedConfigs);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/config/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedConfigs);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(Socket, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ConfigService);

    mockedConfigs = [];
    const mockedConfig = new PlatformConfig();
    mockedConfig._id = '0';
    const mockedExpenseType = new ExpenseType();
    mockedExpenseType.name = 'mockedExpenseType';
    mockedConfig.expenseTypes.push(cloneDeep(mockedExpenseType));
    mockedConfigs.push(cloneDeep(mockedConfig));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveConfig should work', (done: DoneFn) => {
    const tmpConfig = new PlatformConfig();
    const tmpExpenseType = new ExpenseType();
    tmpExpenseType.name = 'tmpExpenseType';
    tmpConfig.expenseTypes.push(cloneDeep(tmpExpenseType));

    let i = 1;
    const data = {
      ns: {
        coll: 'platformconfigs',
      },
      operationType: 'insert',
      fullDocument: tmpConfig,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getConfig()
      .pipe(take(3))
      .subscribe((configs: PlatformConfig[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(configs.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(configs.length).toBe(1);
            expect(configs).toEqual(mockedConfigs);
            service.saveConfig(tmpConfig);
            const req1 = httpMock.expectOne('/api/config/');
            expect(req1.request.method).toBe('POST');
            req1.flush({ config: tmpConfig });
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(configs.length).toBe(2);
            mockedConfigs.push(tmpConfig);
            expect(configs).toEqual(mockedConfigs);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    // mock response
    const req = httpMock.expectOne('/api/config/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedConfigs);
    }, 50);
  });

  it('editConfig should work', (done: DoneFn) => {
    const tmpConfig = cloneDeep(mockedConfigs[0]);
    let i = 1;
    const data = {
      ns: {
        coll: 'platformconfigs',
      },
      operationType: 'update',
      documentKey: {
        _id: '0',
      },
      updateDescription: {
        updatedFields: {
          expenseTypes: [
            {
              name: 'editTestExpenseType',
              subTypes: ['editTestExpenseSubType'],
            },
          ],
        },
        removedFields: [] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getConfig()
      .pipe(take(3))
      .subscribe((configs: PlatformConfig[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(configs.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(configs.length).toBe(1);
            expect(configs).toEqual(mockedConfigs);
            service.editConfig(tmpConfig);
            const req1 = httpMock.expectOne('/api/config/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(configs.length).toBe(1);
            expect(configs[0].expenseTypes).toEqual([
              { name: 'editTestExpenseType', subTypes: ['editTestExpenseSubType'] },
            ]);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    // mock response
    const req = httpMock.expectOne('/api/config/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedConfigs);
    }, 50);
  });

  baseTest('getConfig should work', (expectedConfigs: PlatformConfig[]) => {});
});
