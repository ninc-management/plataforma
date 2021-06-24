import { TestBed } from '@angular/core/testing';

import { InvoiceService } from './invoice.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { Invoice } from '../../../../backend/src/models/invoice';
import { User } from '../../../../backend/src/models/user';
import { HttpTestingController } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';
import { AuthService } from 'app/auth/auth.service';
import { Socket } from 'ngx-socket-io';
import MockedServerSocket from 'socket.io-mock';
import { cloneDeep } from 'lodash';
import { take } from 'rxjs/operators';
import { parseISO } from 'date-fns';
import { CONTRACT_BALANCE } from './user.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  let mockedInvoices: Invoice[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>(
    'AuthService',
    ['userEmail'],
    { onUserChange$: new Subject<void>() }
  );
  const socketServiceSpy = jasmine.createSpyObj<Socket>('Socket', [
    'fromEvent',
  ]);

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(Socket, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(InvoiceService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedUsers = [];
    mockedInvoices = [];
    const tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.fullName = 'Test1';
    tmpUser.email = 'test1@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));
    tmpUser._id = '1';
    tmpUser.fullName = 'Test2';
    tmpUser.email = 'test2@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));
    let tmpInvoice = new Invoice();
    tmpInvoice._id = '0';
    tmpInvoice.author = mockedUsers[0];
    tmpInvoice.department = 'DPC';
    tmpInvoice.coordination = 'test';
    tmpInvoice.code = 'test';
    tmpInvoice.contractor = '0';
    tmpInvoice.trello = true;
    tmpInvoice.team.push({ user: '1', coordination: 'test' });
    mockedInvoices.push(cloneDeep(tmpInvoice));
    tmpInvoice = new Invoice();
    tmpInvoice._id = '1';
    tmpInvoice.author = mockedUsers[1];
    tmpInvoice.department = 'DEC';
    tmpInvoice.coordination = 'test';
    tmpInvoice.code = 'test1';
    tmpInvoice.contractor = '0';
    tmpInvoice.trello = false;
    tmpInvoice.team.push({ user: '0', coordination: 'test' });
    mockedInvoices.push(cloneDeep(tmpInvoice));
    // mock response
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

  it('saveInvoice', (done: DoneFn) => {
    const tmpInvoice = new Invoice();
    tmpInvoice._id = '2';
    tmpInvoice.author = mockedUsers[0];
    tmpInvoice.department = 'DPC';
    tmpInvoice.coordination = 'test';
    tmpInvoice.code = 'test';
    tmpInvoice.contractor = '0';
    let i = 1;
    const data = {
      ns: {
        coll: 'invoices',
      },
      operationType: 'insert',
      fullDocument: tmpInvoice,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getInvoices()
      .pipe(take(3))
      .subscribe((invoices) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(invoices.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(invoices.length).toBe(2);
            expect(invoices).toEqual(
              JSON.parse(JSON.stringify(mockedInvoices), (k, v) => {
                if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
                return v;
              }) as Invoice[]
            );
            service.saveInvoice(tmpInvoice);
            const req1 = httpMock.expectOne('/api/invoice/');
            expect(req1.request.method).toBe('POST');
            req1.flush({ invoice: tmpInvoice });
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(invoices.length).toBe(3);
            mockedInvoices.push(tmpInvoice);
            expect(invoices).toEqual(
              JSON.parse(JSON.stringify(mockedInvoices), (k, v) => {
                if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
                return v;
              }) as Invoice[]
            );
            done();
            break;
          }
          default: {
            break;
          }
        }
      }); // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });

  it('editInvoice', (done: DoneFn) => {
    const tmpInvoice = cloneDeep(mockedInvoices[1]);
    tmpInvoice.department = 'DAD';
    let i = 1;
    const data = {
      ns: {
        coll: 'invoices',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { department: 'DAD' },
        removedFields: ['trello'] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getInvoices()
      .pipe(take(3))
      .subscribe((invoices) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(invoices.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(invoices.length).toBe(2);
            expect(invoices).toEqual(
              JSON.parse(JSON.stringify(mockedInvoices), (k, v) => {
                if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
                return v;
              }) as Invoice[]
            );
            service.editInvoice(tmpInvoice);
            const req1 = httpMock.expectOne('/api/invoice/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(invoices.length).toBe(2);
            mockedInvoices.push(tmpInvoice);
            expect(invoices[1].trello).toBe(undefined);
            expect(invoices[1].department).toBe('DAD');
            done();
            break;
          }
          default: {
            break;
          }
        }
      }); // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });

  it('getInvoices', (done: DoneFn) => {
    let i = 1;

    service
      .getInvoices()
      .pipe(take(2))
      .subscribe((invoices) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(invoices.length).toBe(0);
            break;
          }
          case 2: {
            expect(invoices.length).toBe(2);
            expect(invoices).toEqual(
              JSON.parse(JSON.stringify(mockedInvoices), (k, v) => {
                if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
                return v;
              }) as Invoice[]
            );
            done();
            break;
          }
          default: {
            break;
          }
        }
      }); // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });

  it('invoicesSize', (done: DoneFn) => {
    let i = 1;

    service
      .invoicesSize()
      .pipe(take(2))
      .subscribe((size) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(size).toBe(0);
            break;
          }
          case 2: {
            expect(size).toEqual(3);
            done();
            break;
          }
          default: {
            break;
          }
        }
      }); // mock response
    const req = httpMock.expectOne('/api/invoice/count');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush({ size: '2' });
    }, 50);
  });

  it('idToInvoice', (done: DoneFn) => {
    let i = 1;

    service
      .getInvoices()
      .pipe(take(2))
      .subscribe((invoices) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(invoices.length).toBe(0);
            break;
          }
          case 2: {
            const expectedInvoices = JSON.parse(
              JSON.stringify(mockedInvoices),
              (k, v) => {
                if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
                return v;
              }
            ) as Invoice[];
            expect(invoices.length).toBe(2);
            expect(invoices).toEqual(expectedInvoices);
            expect(service.idToInvoice('0')).toEqual(expectedInvoices[0]);
            expect(service.idToInvoice(expectedInvoices[0])).toEqual(
              expectedInvoices[0]
            );
            expect(service.idToInvoice('1')).toEqual(expectedInvoices[1]);
            expect(service.idToInvoice(expectedInvoices[1])).toEqual(
              expectedInvoices[1]
            );
            done();
            break;
          }
          default: {
            break;
          }
        }
      }); // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });

  it('isInvoiceAuthor', (done: DoneFn) => {
    let i = 1;

    service
      .getInvoices()
      .pipe(take(2))
      .subscribe((invoices) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(invoices.length).toBe(0);
            break;
          }
          case 2: {
            const expectedInvoices = JSON.parse(
              JSON.stringify(mockedInvoices),
              (k, v) => {
                if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
                return v;
              }
            ) as Invoice[];
            expect(invoices.length).toBe(2);
            expect(invoices).toEqual(expectedInvoices);
            expect(service.isInvoiceAuthor('0', '0')).toBe(true);
            expect(service.isInvoiceAuthor(expectedInvoices[1], '1')).toBe(
              true
            );
            expect(service.isInvoiceAuthor('0', mockedUsers[1])).toBe(false);
            expect(
              service.isInvoiceAuthor(expectedInvoices[1], mockedUsers[0])
            ).toBe(false);
            done();
            break;
          }
          default: {
            break;
          }
        }
      }); // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });

  it('isInvoiceMember', (done: DoneFn) => {
    let i = 1;

    service
      .getInvoices()
      .pipe(take(2))
      .subscribe((invoices) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(invoices.length).toBe(0);
            break;
          }
          case 2: {
            const expectedInvoices = JSON.parse(
              JSON.stringify(mockedInvoices),
              (k, v) => {
                if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
                return v;
              }
            ) as Invoice[];
            expect(invoices.length).toBe(2);
            expect(invoices).toEqual(expectedInvoices);
            expect(service.isInvoiceMember('1', '0')).toBe(true);
            expect(service.isInvoiceMember(expectedInvoices[0], '1')).toBe(
              true
            );
            expect(service.isInvoiceMember('1', mockedUsers[1])).toBe(false);
            expect(
              service.isInvoiceMember(expectedInvoices[0], mockedUsers[0])
            ).toBe(false);
            done();
            break;
          }
          default: {
            break;
          }
        }
      }); // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });

  it('role', (done: DoneFn) => {
    let i = 1;

    service
      .getInvoices()
      .pipe(take(2))
      .subscribe((invoices) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(invoices.length).toBe(0);
            break;
          }
          case 2: {
            const expectedInvoices = JSON.parse(
              JSON.stringify(mockedInvoices),
              (k, v) => {
                if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
                return v;
              }
            ) as Invoice[];
            expect(invoices.length).toBe(2);
            expect(invoices).toEqual(expectedInvoices);
            expect(service.role(expectedInvoices[0], mockedUsers[0])).toBe(
              'Gestor'
            );
            expect(service.role(expectedInvoices[0], mockedUsers[1])).toBe(
              'Equipe'
            );
            expect(
              service.role(expectedInvoices[0], CONTRACT_BALANCE as User)
            ).toBe('Nenhum');
            expect(service.role(expectedInvoices[1], mockedUsers[1])).toBe(
              'Gestor'
            );
            expect(service.role(expectedInvoices[1], mockedUsers[0])).toBe(
              'Equipe'
            );
            done();
            break;
          }
          default: {
            break;
          }
        }
      }); // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });
});
