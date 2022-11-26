import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';
import { cloneDeep } from 'lodash';
import { Subject, take } from 'rxjs';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';

import { ProviderService } from './provider.service';
import { WebSocketService } from './web-socket.service';
import { AuthService } from 'app/auth/auth.service';

import { Provider } from '@models/provider';

describe('ProviderService', () => {
  let service: ProviderService;
  let httpMock: HttpTestingController;
  let mockedProviders: Provider[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);

  CommonTestingModule.setUpTestBed();
  const baseTest = (name: string, test: (expectedProviders: Provider[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getProviders()
        .pipe(take(2))
        .subscribe((providers) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(providers.length).toBe(0);
              break;
            }
            case 2: {
              const expectedProviders = mockedProviders;
              expect(providers.length).toBe(2);
              expect(providers).toEqual(expectedProviders);
              test(expectedProviders);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/provider/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedProviders);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(ProviderService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedProviders = [];
    const tmpProvider = new Provider();
    tmpProvider._id = '0';
    tmpProvider.address = 'rua teste1';
    tmpProvider.document = '000.000.000-11';
    tmpProvider.email = 'test1@te.st';
    tmpProvider.name = 'Test1';
    tmpProvider.phone = '(00) 0000-0000';
    mockedProviders.push(cloneDeep(tmpProvider));
    tmpProvider._id = '1';
    tmpProvider.address = 'rua teste2';
    tmpProvider.document = '000.000.000-12';
    tmpProvider.email = 'test2@te.st';
    tmpProvider.name = 'Test2';
    tmpProvider.phone = '(00) 0000-0000';
    mockedProviders.push(cloneDeep(tmpProvider));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveProvider should work', (done: DoneFn) => {
    const tmpProvider = new Provider();
    tmpProvider._id = '2';
    tmpProvider.address = 'rua teste3';
    tmpProvider.document = '000.000.000-13';
    tmpProvider.email = 'test3@te.st';
    tmpProvider.name = 'Test3';
    tmpProvider.phone = '(00) 0000-0000';
    let i = 1;
    const data = {
      ns: {
        coll: 'providers',
      },
      operationType: 'insert',
      fullDocument: tmpProvider,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));
    service
      .getProviders()
      .pipe(take(3))
      .subscribe((providers) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(providers.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(providers.length).toBe(2);
            expect(providers).toEqual(mockedProviders);
            service.saveProvider(tmpProvider);
            const req1 = httpMock.expectOne('/api/provider/');
            expect(req1.request.method).toBe('POST');
            req1.flush({ provider: tmpProvider });
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(providers.length).toBe(3);
            mockedProviders.push(tmpProvider);
            expect(providers).toEqual(mockedProviders);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/provider/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedProviders);
    }, 50);
  });

  it('editProvider should be work', (done: DoneFn) => {
    const tmpProvider = cloneDeep(mockedProviders[1]);
    let i = 1;
    tmpProvider.phone = '(82) 9987-0312';
    const data = {
      ns: {
        coll: 'providers',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { phone: '(82) 9987-0312' },
        removedFields: [] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getProviders()
      .pipe(take(3))
      .subscribe((providers) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(providers.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(providers.length).toBe(2);
            expect(providers).toEqual(mockedProviders);
            service.editProvider(tmpProvider);
            const req1 = httpMock.expectOne('/api/provider/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(providers.length).toBe(2);
            expect(providers[1].phone).toBe(tmpProvider.phone);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    const req = httpMock.expectOne('/api/provider/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedProviders);
    }, 50);
  });

  baseTest('getProviders should work', (expectedProviders: Provider[]) => {});

  baseTest('idToProvider should work', (expectedProviders: Provider[]) => {
    expect(service.idToProvider('0')).toEqual(expectedProviders[0]);
    expect(service.idToProvider(mockedProviders[0])).toEqual(expectedProviders[0]);
    expect(service.idToProvider('1')).toEqual(expectedProviders[1]);
    expect(service.idToProvider(mockedProviders[1])).toEqual(expectedProviders[1]);
  });
});
