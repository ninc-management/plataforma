import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';
import { cloneDeep } from 'lodash';
import { Subject, take } from 'rxjs';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';

import { InternalTransactionService } from './internalTransaction.service';
import { WebSocketService } from './web-socket.service';
import { reviveDates } from 'app/shared/utils';

import { InternalTransaction } from '@models/internalTransaction';

describe('InternalTransactionService', () => {
  let service: InternalTransactionService;
  let httpMock: HttpTestingController;
  let mockedTransactions: InternalTransaction[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);

  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedTransactions: InternalTransaction[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getTransactions()
        .pipe(take(2))
        .subscribe((transactions) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(transactions.length).toBe(0);
              break;
            }
            case 2: {
              const expectedTransactions = reviveDates(mockedTransactions);
              expect(transactions.length).toBe(3);
              expect(transactions).toEqual(expectedTransactions);
              test(expectedTransactions);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/transaction/internal/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedTransactions);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(InternalTransactionService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedTransactions = [];
    // Ordem de Pagamento
    let tmpTransaction = new InternalTransaction();
    tmpTransaction._id = '0';
    tmpTransaction.author = '0';
    tmpTransaction.modelFrom = 'Contract';
    tmpTransaction.from = '0';
    tmpTransaction.modelTo = 'User';
    tmpTransaction.to = '0';
    tmpTransaction.description = 'Ordem de pagamento 01/02 do teste';
    tmpTransaction.type = 'Pagamento';
    tmpTransaction.value = '1.000,00';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#1';
    mockedTransactions.push(tmpTransaction);
    // Apote em time
    tmpTransaction = new InternalTransaction();
    tmpTransaction._id = '1';
    tmpTransaction.author = '0';
    tmpTransaction.modelFrom = 'Team';
    tmpTransaction.from = '0';
    tmpTransaction.modelTo = 'Team';
    tmpTransaction.to = '1';
    tmpTransaction.description = 'Redistribuição mensal para os caixas dos times';
    tmpTransaction.type = 'Aporte';
    tmpTransaction.value = '500,00';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#2';
    mockedTransactions.push(tmpTransaction);
    // Distribuição de lucro
    tmpTransaction = new InternalTransaction();
    tmpTransaction._id = '2';
    tmpTransaction.author = '0';
    tmpTransaction.modelFrom = 'Team';
    tmpTransaction.from = '0';
    tmpTransaction.modelTo = 'User';
    tmpTransaction.to = '0';
    tmpTransaction.description = 'Distribuição de lucro trimestral 1/4';
    tmpTransaction.type = 'Distribuição de lucro';
    tmpTransaction.value = '2000,00';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#3';
    mockedTransactions.push(tmpTransaction);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveTransaction should work', (done: DoneFn) => {
    const tmpTransaction = new InternalTransaction();
    tmpTransaction._id = '3';
    tmpTransaction.author = '0';
    tmpTransaction.modelFrom = 'Contract';
    tmpTransaction.from = '0';
    tmpTransaction.modelTo = 'Team';
    tmpTransaction.to = '1';
    tmpTransaction.description = 'Aporte do resto do dinheiro do contrato no time';
    tmpTransaction.type = 'Aporte';
    tmpTransaction.value = '500,00';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#4';
    let i = 1;
    const data = {
      ns: {
        coll: 'internaltransactions',
      },
      operationType: 'insert',
      fullDocument: tmpTransaction,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getTransactions()
      .pipe(take(3))
      .subscribe((transactions) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(transactions.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(transactions.length).toBe(3);
            expect(transactions).toEqual(reviveDates(mockedTransactions));
            service.saveTransaction(tmpTransaction);
            const req1 = httpMock.expectOne('/api/transaction/internal/');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(transactions.length).toBe(4);
            mockedTransactions.push(tmpTransaction);
            expect(transactions).toEqual(reviveDates(mockedTransactions));
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/transaction/internal/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedTransactions);
    }, 50);
  });

  it('saveManyTransaction should work', (done: DoneFn) => {
    const tmpTransaction1 = new InternalTransaction();
    tmpTransaction1._id = '3';
    tmpTransaction1.author = '0';
    tmpTransaction1.modelFrom = 'Contract';
    tmpTransaction1.from = '0';
    tmpTransaction1.modelTo = 'User';
    tmpTransaction1.to = '0';
    tmpTransaction1.description = 'Ordem de pagamento 02/02 do teste';
    tmpTransaction1.type = 'Pagamento';
    tmpTransaction1.value = '500,00';
    tmpTransaction1.paid = true;
    tmpTransaction1.paidDate = tmpTransaction1.created;
    tmpTransaction1.code = '#4';
    const tmpTransaction2 = cloneDeep(tmpTransaction1);
    tmpTransaction2._id = '4';
    tmpTransaction1.to = '1';
    tmpTransaction2.code = '#5';
    let i = 1;
    let reqSave: TestRequest;

    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getTransactions()
      .pipe(take(4))
      .subscribe((transactions) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(transactions.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(transactions.length).toBe(3);
            expect(transactions).toEqual(reviveDates(mockedTransactions));
            service.saveManyTransaction([tmpTransaction1, tmpTransaction2]);
            reqSave = httpMock.expectOne('/api/transaction/internal/many');
            expect(reqSave.request.method).toBe('POST');
            reqSave.flush(null);
            socket.emit('dbchange', {
              ns: {
                coll: 'internaltransactions',
              },
              operationType: 'insert',
              fullDocument: reqSave.request.body.transactions[0],
            });
            break;
          }
          case 3: {
            i += 1;
            expect(transactions.length).toBe(4);
            socket.emit('dbchange', {
              ns: {
                coll: 'internaltransactions',
              },
              operationType: 'insert',
              fullDocument: reqSave.request.body.transactions[1],
            });
            break;
          }
          case 4: {
            expect(transactions.length).toBe(5);
            mockedTransactions.push(tmpTransaction1);
            mockedTransactions.push(tmpTransaction2);
            expect(transactions).toEqual(reviveDates(mockedTransactions));
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/transaction/internal/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedTransactions);
    }, 50);
  });

  it('editTransaction should work', (done: DoneFn) => {
    const tmpTransaction = cloneDeep(mockedTransactions[0]);
    tmpTransaction.value = '2.000,00';

    let i = 1;
    const editionHistoryItem = { author: '0', comment: 'test', date: new Date() };
    const data = {
      ns: {
        coll: 'internaltransactions',
      },
      operationType: 'update',
      documentKey: {
        _id: '0',
      },
      updateDescription: {
        updatedFields: { value: '2.000,00', editionHistory: [editionHistoryItem] },
        removedFields: [] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getTransactions()
      .pipe(take(3))
      .subscribe((transactions) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(transactions.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(transactions.length).toBe(3);
            expect(transactions).toEqual(reviveDates(mockedTransactions));
            service.editTransaction(tmpTransaction, editionHistoryItem);
            const req1 = httpMock.expectOne('/api/transaction/internal/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(transactions.length).toBe(3);
            expect(transactions[0].value).toBe(tmpTransaction.value);
            expect(reviveDates(transactions[0].editionHistory)).toEqual([editionHistoryItem]);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/transaction/internal/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedTransactions);
    }, 50);
  });

  baseTest('getTransactions should work', (expectedTransactions: InternalTransaction[]) => {});
});
