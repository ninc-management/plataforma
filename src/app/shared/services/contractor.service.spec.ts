import { TestBed } from '@angular/core/testing';

import { ContractorService } from './contractor.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { AuthService } from 'app/auth/auth.service';

import { HttpTestingController } from '@angular/common/http/testing';
import { User } from '@models/user';
import { Subject } from 'rxjs';
import MockedServerSocket from 'socket.io-mock';
import { Contractor } from '@models/contractor';
import { SocketMock } from 'types/socketio-mock';
import { cloneDeep } from 'lodash';
import { take } from 'rxjs/operators';
import { parseISO } from 'date-fns';
import { WebSocketService } from './web-socket.service';

describe('ContractorService', () => {
  let service: ContractorService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  let mockedContractors: Contractor[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);

  CommonTestingModule.setUpTestBed();
  const baseTest = (name: string, test: (expectedContractors: Contractor[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getContractors()
        .pipe(take(2))
        .subscribe((contractors) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(contractors.length).toBe(0);
              break;
            }
            case 2: {
              const expectedContractors = mockedContractors;
              expect(contractors.length).toBe(2);
              expect(contractors).toEqual(expectedContractors);
              test(expectedContractors);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/contractor/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedContractors);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(ContractorService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedUsers = [];
    mockedContractors = [];
    const tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.name = 'Test1';
    tmpUser.email = 'test1@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));
    const tmpContractor = new Contractor();
    tmpContractor._id = '0';
    tmpContractor.address = {
      zipCode: '',
      streetAddress: 'rua teste1',
      houseNumber: '',
      district: '',
      complement: '',
      city: '',
      state: '',
    };
    tmpContractor.document = '000.000.000-11';
    tmpContractor.email = 'test1@te.st';
    tmpContractor.name = 'Test1';
    tmpContractor.phone = '(00) 0000-0000';
    mockedContractors.push(cloneDeep(tmpContractor));
    tmpContractor._id = '1';
    tmpContractor.address = {
      zipCode: '',
      streetAddress: 'rua teste2',
      houseNumber: '',
      district: '',
      complement: '',
      city: '',
      state: '',
    };
    tmpContractor.document = '000.000.000-12';
    tmpContractor.email = 'test2@te.st';
    tmpContractor.name = 'Test2';
    tmpContractor.phone = '(00) 0000-0000';
    mockedContractors.push(cloneDeep(tmpContractor));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveContractor should work', (done: DoneFn) => {
    const tmpContractor = new Contractor();
    tmpContractor._id = '2';
    tmpContractor.address = {
      zipCode: '',
      streetAddress: 'rua teste3',
      houseNumber: '',
      district: '',
      complement: '',
      city: '',
      state: '',
    };
    tmpContractor.document = '000.000.000-13';
    tmpContractor.email = 'test3@te.st';
    tmpContractor.name = 'Test3';
    tmpContractor.phone = '(00) 0000-0000';
    let i = 1;
    const data = {
      ns: {
        coll: 'contractors',
      },
      operationType: 'insert',
      fullDocument: tmpContractor,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getContractors()
      .pipe(take(3))
      .subscribe((contractors) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(contractors.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(contractors.length).toBe(2);
            expect(contractors).toEqual(mockedContractors);
            service.saveContractor(tmpContractor);
            const req1 = httpMock.expectOne('/api/contractor/');
            expect(req1.request.method).toBe('POST');
            req1.flush({ contractor: tmpContractor });
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(contractors.length).toBe(3);
            mockedContractors.push(tmpContractor);
            expect(contractors).toEqual(mockedContractors);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/contractor/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedContractors);
    }, 50);
  });

  it('editContractor should be work', (done: DoneFn) => {
    const tmpContractor = cloneDeep(mockedContractors[1]);
    let i = 1;
    tmpContractor.phone = '(82) 9987-0312';
    const data = {
      ns: {
        coll: 'contractors',
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
      .getContractors()
      .pipe(take(3))
      .subscribe((contractors) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(contractors.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(contractors.length).toBe(2);
            expect(contractors).toEqual(mockedContractors);
            service.editContractor(tmpContractor);
            const req1 = httpMock.expectOne('/api/contractor/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(contractors.length).toBe(2);
            expect(contractors[1].phone).toBe(tmpContractor.phone);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    const req = httpMock.expectOne('/api/contractor/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedContractors);
    }, 50);
  });

  baseTest('getContractors should work', (expectedContractors: Contractor[]) => {});

  baseTest('idToContractor should work', (expectedContractors: Contractor[]) => {
    expect(service.idToContractor('0')).toEqual(expectedContractors[0]);
    expect(service.idToContractor(mockedContractors[0])).toEqual(expectedContractors[0]);
    expect(service.idToContractor('1')).toEqual(expectedContractors[1]);
    expect(service.idToContractor(mockedContractors[1])).toEqual(expectedContractors[1]);
  });
});
