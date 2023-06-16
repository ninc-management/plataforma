import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';
import { cloneDeep } from 'lodash';
import { of, Subject, take } from 'rxjs';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';

import { externalMockedCompanies } from '../mocked-data/mocked-companies';
import { externalMockedConfigs } from '../mocked-data/mocked-config';
import { ConfigService, DEFAULT_CONFIG } from './config.service';
import { WebSocketService } from './web-socket.service';
import { AuthService } from 'app/auth/auth.service';

import { PlatformConfig } from '@models/platformConfig';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;
  let mockedConfigs: PlatformConfig[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
    isCompanyLoaded$: of(true),
    companyId: externalMockedCompanies[0]._id,
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);
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
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ConfigService);
    mockedConfigs = cloneDeep(externalMockedConfigs);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveConfig should work', (done: DoneFn) => {
    let i = 1;
    const data = {
      ns: {
        coll: 'platformconfigs',
      },
      operationType: 'insert',
      fullDocument: mockedConfigs[0],
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
            expect(configs.length).toBe(0);
            expect(configs).toEqual([]);
            service.saveConfig(mockedConfigs[0]);
            const req1 = httpMock.expectOne('/api/config/');
            expect(req1.request.method).toBe('POST');
            req1.flush({ config: mockedConfigs[0] });
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(configs.length).toBe(1);
            expect(configs).toEqual(JSON.parse(JSON.stringify(mockedConfigs)));
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
      req.flush([]);
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
          expenseConfig: {
            adminExpenseTypes: [
              {
                name: 'editTestExpenseType',
                subTypes: ['editTestExpenseSubType'],
              },
            ],
          },
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
            expect(configs[0].expenseConfig.adminExpenseTypes).toEqual([
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

  baseTest('expenseSubTypes should work', (expectedConfigs: PlatformConfig[]) => {
    expect(service.expenseSubTypes(expectedConfigs[0].expenseConfig.adminExpenseTypes[1].name)).toEqual(
      DEFAULT_CONFIG.expenseConfig.adminExpenseTypes[1].subTypes
    );

    mockedConfigs[0].expenseConfig.adminExpenseTypes[0].subTypes = [];
    expect(service.expenseSubTypes(mockedConfigs[0].expenseConfig.adminExpenseTypes[0].name)).toEqual([]);
  });
});
