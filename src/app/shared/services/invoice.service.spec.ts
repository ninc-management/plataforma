import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';
import { cloneDeep } from 'lodash';
import { of, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';

import { externalMockedCompanies } from '../mocked-data/mocked-companies';
import { externalMockedInvoices } from '../mocked-data/mocked-invoices';
import { externalMockedUsers } from '../mocked-data/mocked-users';
import { InvoiceService } from './invoice.service';
import { CONTRACT_BALANCE, UserService } from './user.service';
import { WebSocketService } from './web-socket.service';
import { AuthService } from 'app/auth/auth.service';
import { reviveDates } from 'app/shared/utils';

import { Invoice } from '@models/invoice';
import { User } from '@models/user';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let userService: UserService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  let mockedInvoices: Invoice[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
    isCompanyLoaded$: of(true),
    companyId: externalMockedCompanies[0]._id,
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);

  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedInvoices: Invoice[]) => void) => {
    it(name, (done: DoneFn) => {
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
              const expectedInvoices = reviveDates(mockedInvoices);
              expect(invoices.length).toBe(3);
              expect(invoices).toEqual(expectedInvoices);
              test(expectedInvoices);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/invoice/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedInvoices);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue(externalMockedUsers[0].email);
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(InvoiceService);
    userService = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);

    mockedUsers = cloneDeep(externalMockedUsers);
    mockedInvoices = cloneDeep(externalMockedInvoices);

    userService.getUsers().pipe(take(1)).subscribe();
    // mock response
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedUsers);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveInvoice should work', (done: DoneFn) => {
    const tmpInvoice = new Invoice();
    tmpInvoice._id = '2';
    tmpInvoice.author = mockedUsers[0];
    tmpInvoice.nortanTeam = 'Trocar';
    tmpInvoice.sector = 'Trocar';
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
            expect(invoices.length).toBe(3);
            expect(invoices).toEqual(reviveDates(mockedInvoices));
            service.saveInvoice(tmpInvoice);
            const req1 = httpMock.expectOne('/api/invoice/');
            expect(req1.request.method).toBe('POST');
            req1.flush({ invoice: tmpInvoice });
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(invoices.length).toBe(4);
            mockedInvoices.push(tmpInvoice);
            expect(invoices).toEqual(reviveDates(mockedInvoices));
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });

  it('editInvoice should work', (done: DoneFn) => {
    const tmpInvoice = cloneDeep(mockedInvoices[1]);
    tmpInvoice.nortanTeam = 'Trocar';
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
        updatedFields: { nortanTeam: 'Trocar' },
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
            expect(invoices.length).toBe(3);
            expect(invoices).toEqual(reviveDates(mockedInvoices));
            service.editInvoice(tmpInvoice);
            const req1 = httpMock.expectOne('/api/invoice/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(invoices.length).toBe(3);
            expect(invoices[1].trello).toBe(undefined);
            expect(invoices[1].nortanTeam).toBe('Trocar');
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedInvoices);
    }, 50);
  });

  baseTest('getInvoices should work', (expectedInvoices: Invoice[]) => {});

  it('currentYearInvoices should work', (done: DoneFn) => {
    let i = 1;

    service
      .currentYearInvoices()
      .pipe(take(2))
      .subscribe((accumulated) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(accumulated).toBe(0);
            break;
          }
          case 2: {
            expect(accumulated).toEqual(2);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/invoice/currentYearInvoices');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush({ accumulated: '2' });
    }, 50);
  });

  baseTest('idToInvoice should work', (expectedInvoices: Invoice[]) => {
    expect(service.idToInvoice('0')).toEqual(expectedInvoices[0]);
    expect(service.idToInvoice(expectedInvoices[0])).toEqual(expectedInvoices[0]);
    expect(service.idToInvoice('1')).toEqual(expectedInvoices[1]);
    expect(service.idToInvoice(expectedInvoices[1])).toEqual(expectedInvoices[1]);
  });

  baseTest('idToProfilePicture should work', (expectedInvoices: Invoice[]) => {
    expect(service.idToProfilePicture(undefined)).toEqual('');
    expect(service.idToProfilePicture('0')).toEqual(externalMockedUsers[0].profilePicture!);
    expect(service.idToProfilePicture(mockedInvoices[0])).toEqual((expectedInvoices[0].author as User).profilePicture!);
    expect(service.idToProfilePicture('1')).toEqual(externalMockedUsers[1].profilePicture!);
    expect(service.idToProfilePicture(mockedInvoices[1])).toEqual((expectedInvoices[1].author as User).profilePicture!);
  });

  baseTest('isInvoiceAuthor should work', (expectedInvoices: Invoice[]) => {
    expect(service.isInvoiceAuthor('0', '0')).toBe(true);
    expect(service.isInvoiceAuthor(expectedInvoices[1], '1')).toBe(true);
    expect(service.isInvoiceAuthor('0', mockedUsers[1])).toBe(false);
    expect(service.isInvoiceAuthor(expectedInvoices[1], mockedUsers[0])).toBe(false);
  });

  baseTest('isInvoiceMember should work', (expectedInvoices: Invoice[]) => {
    expect(service.isInvoiceMember('1', '0')).toBe(true);
    expect(service.isInvoiceMember(expectedInvoices[0], '1')).toBe(true);
    expect(service.isInvoiceMember('1', mockedUsers[2])).toBe(false);
    expect(service.isInvoiceMember(expectedInvoices[0], mockedUsers[3])).toBe(false);
  });

  baseTest('role should work', (expectedInvoices: Invoice[]) => {
    expect(service.role(expectedInvoices[0], mockedUsers[0])).toBe('Gestor');
    expect(service.role(expectedInvoices[0], mockedUsers[1])).toBe('Equipe');
    expect(service.role(expectedInvoices[0], CONTRACT_BALANCE as User)).toBe('Nenhum');
    expect(service.role(expectedInvoices[1], mockedUsers[1])).toBe('Gestor');
    expect(service.role(expectedInvoices[1], mockedUsers[0])).toBe('Equipe');
  });

  baseTest('teamMembers should work', (expectedInvoices: Invoice[]) => {
    expect(service.teamMembers(mockedInvoices[0])).toEqual(reviveDates(mockedUsers.slice(0, 2)));
    expect(service.teamMembers(mockedInvoices[1])).toEqual(reviveDates(mockedUsers.slice(0, 2).reverse()));
  });
});
