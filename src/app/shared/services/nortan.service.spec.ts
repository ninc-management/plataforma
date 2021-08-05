import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { parseISO } from 'date-fns';
import { cloneDeep } from 'lodash';
import { Socket } from 'ngx-socket-io';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { SocketMock } from 'types/socketio-mock';
import MockedServerSocket from 'socket.io-mock';

import {
  NortanService,
  NORTAN_EXPENSE_TYPES,
  NORTAN_FIXED_EXPENSE_TYPES,
} from './nortan.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { NORTAN } from './user.service';
import { Expense } from '@models/expense';
import { User } from '@models/user';

describe('NortanService', () => {
  let service: NortanService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  let mockedExpenses: Expense[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const socketServiceSpy = jasmine.createSpyObj<Socket>('Socket', [
    'fromEvent',
  ]);

  CommonTestingModule.setUpTestBed();

  const baseTest = (
    name: string,
    test: (expectedExpenses: Expense[], done: DoneFn) => void
  ) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getExpenses()
        .pipe(take(2))
        .subscribe((expenses) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(expenses.length).toBe(0);
              break;
            }
            case 2: {
              const expectedExpenses = JSON.parse(
                JSON.stringify(mockedExpenses),
                (k, v) => {
                  if (['created', 'lastUpdate', 'paidDate'].includes(k))
                    return parseISO(v);
                  return v;
                }
              ) as Expense[];
              expect(expenses.length).toBe(2);
              expect(expenses).toEqual(expectedExpenses);
              test(expectedExpenses, done);
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/nortan/allExpenses');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedExpenses);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(Socket, { useValue: socketServiceSpy });
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(NortanService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedUsers = [];
    mockedExpenses = [];
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
    let tmpExpense = new Expense();
    tmpExpense._id = '0';
    tmpExpense.author = '0';
    tmpExpense.source = '1';
    tmpExpense.description = 'Teste';
    tmpExpense.type = NORTAN_EXPENSE_TYPES.CUSTO_OPERACIONAL;
    tmpExpense.value = '100,00';
    tmpExpense.code = '#0';
    tmpExpense.paidDate = new Date();
    mockedExpenses.push(cloneDeep(tmpExpense));
    tmpExpense = new Expense();
    tmpExpense._id = '1';
    tmpExpense.author = '1';
    tmpExpense.source = NORTAN._id;
    tmpExpense.description = 'Teste';
    tmpExpense.type = NORTAN_EXPENSE_TYPES.GASTOS_FIXOS;
    tmpExpense.fixedType = NORTAN_FIXED_EXPENSE_TYPES.ALUGUEL;
    tmpExpense.value = '2.000,00';
    tmpExpense.code = '#1';
    tmpExpense.paidDate = new Date();
    mockedExpenses.push(cloneDeep(tmpExpense));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveExpense should work', (done: DoneFn) => {
    const tmpExpense = new Expense();
    tmpExpense._id = '2';
    tmpExpense.author = '1';
    tmpExpense.source = '0';
    tmpExpense.description = 'Teste';
    tmpExpense.type = NORTAN_EXPENSE_TYPES.DESPESAS;
    tmpExpense.value = '100,00';
    tmpExpense.code = '#2';
    tmpExpense.paidDate = new Date();
    let i = 1;
    const data = {
      ns: {
        coll: 'expenses',
      },
      operationType: 'insert',
      fullDocument: tmpExpense,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getExpenses()
      .pipe(take(3))
      .subscribe((expenses) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(expenses.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            const expectedExpenses = JSON.parse(
              JSON.stringify(mockedExpenses),
              (k, v) => {
                if (['created', 'lastUpdate', 'paidDate'].includes(k))
                  return parseISO(v);
                return v;
              }
            ) as Expense[];
            expect(expenses.length).toBe(mockedExpenses.length);
            expect(expenses).toEqual(expectedExpenses);
            service.saveExpense(tmpExpense);
            const req1 = httpMock.expectOne('/api/nortan/expense');
            expect(req1.request.method).toBe('POST');
            req1.flush('');
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(expenses.length).toBe(3);
            mockedExpenses.push(tmpExpense);
            const expectedExpenses = JSON.parse(
              JSON.stringify(mockedExpenses),
              (k, v) => {
                if (['created', 'lastUpdate', 'paidDate'].includes(k))
                  return parseISO(v);
                return v;
              }
            ) as Expense[];
            expect(expenses).toEqual(expectedExpenses);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/nortan/allExpenses');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedExpenses);
    }, 50);
  });

  it('editExpense should work', (done: DoneFn) => {
    const tmpExpense = cloneDeep(mockedExpenses[1]);
    tmpExpense.paid = false;
    delete tmpExpense.paidDate;
    let i = 1;
    const data = {
      ns: {
        coll: 'expenses',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { paid: false },
        removedFields: ['paidDate'] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getExpenses()
      .pipe(take(3))
      .subscribe((expenses) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(expenses.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            const expectedExpenses = JSON.parse(
              JSON.stringify(mockedExpenses),
              (k, v) => {
                if (['created', 'lastUpdate', 'paidDate'].includes(k))
                  return parseISO(v);
                return v;
              }
            ) as Expense[];
            expect(expenses.length).toBe(mockedExpenses.length);
            expect(expenses).toEqual(expectedExpenses);
            service.editExpense(tmpExpense);
            const req1 = httpMock.expectOne('/api/nortan/updateExpense');
            expect(req1.request.method).toBe('POST');
            req1.flush('');
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(expenses.length).toBe(2);
            expect(expenses[1].paid).toBe(false);
            expect(expenses[1].paidDate).toBe(undefined);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/nortan/allExpenses');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedExpenses);
    }, 50);
  });

  baseTest(
    'getExpenses should work',
    (expectedExpenses: Expense[], done: DoneFn) => {
      done();
    }
  );

  baseTest(
    'expensesSize should work',
    (expectedExpenses: Expense[], done: DoneFn) => {
      service
        .expensesSize()
        .pipe(take(1))
        .subscribe((size) => {
          expect(size).toBe(expectedExpenses.length);
          done();
        });
    }
  );
});
