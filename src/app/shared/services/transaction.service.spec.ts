import { TestBed } from '@angular/core/testing';

import { TransactionService } from './transaction.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Transaction } from '@models/transaction';
import { Subject, take } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';

import MockedServerSocket from 'socket.io-mock';
import { cloneDeep } from 'lodash';

import { Fees, reviveDates } from 'app/shared/utils';
import { Team } from '@models/team';
import { PlatformConfig } from '@models/platformConfig';
import { DEFAULT_CONFIG } from './config.service';
import { WebSocketService } from './web-socket.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;
  let mockedConfigs: PlatformConfig[];
  let mockedTeams: Team[];
  let mockedTransactions: Transaction[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);

  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedTransactions: Transaction[]) => void) => {
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
              expect(transactions.length).toBe(4);
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
      const req = httpMock.expectOne('/api/transaction/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedTransactions);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedTransactions = [];
    mockedTeams = [];
    mockedConfigs = [];

    // Ordem de empenho
    let tmpTransaction = new Transaction();
    tmpTransaction._id = '0';
    tmpTransaction.author = '0';
    tmpTransaction.contract = '0';
    tmpTransaction.costCenter = '100'; // Id do time
    tmpTransaction.description = 'Ordem de empenho 01/02 do teste';
    tmpTransaction.nf = false;
    tmpTransaction.type = 'Receita';
    tmpTransaction.value = '1.000,00';
    tmpTransaction.notaFiscal = '15,00';
    tmpTransaction.nortanPercentage = '15,50';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#1';
    mockedTransactions.push(tmpTransaction);
    // Despesa de contrato
    tmpTransaction = new Transaction();
    tmpTransaction._id = '1';
    tmpTransaction.author = '1';
    tmpTransaction.contract = '1';
    tmpTransaction.costCenter = '100';
    tmpTransaction.description = 'Despesa de teste de contrato';
    tmpTransaction.nf = false;
    tmpTransaction.type = 'Folha de Pagamento';
    tmpTransaction.value = '500,00';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#2';
    mockedTransactions.push(tmpTransaction);
    // Despesa de time
    tmpTransaction = new Transaction();
    tmpTransaction._id = '2';
    tmpTransaction.author = '0';
    tmpTransaction.costCenter = '100';
    tmpTransaction.description = 'Despesa de teste de time';
    tmpTransaction.nf = false;
    tmpTransaction.type = 'Outros';
    tmpTransaction.value = '200,00';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#3';
    mockedTransactions.push(tmpTransaction);
    // Saque
    tmpTransaction = new Transaction();
    tmpTransaction._id = '3';
    tmpTransaction.author = '0';
    tmpTransaction.costCenter = '0'; //Id do autor
    tmpTransaction.description = 'Saque do caixa pessoal';
    tmpTransaction.nf = false;
    tmpTransaction.type = 'Divisão de Lucro';
    tmpTransaction.value = '800,00';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#4';
    mockedTransactions.push(tmpTransaction);

    let tmpConfig = cloneDeep(DEFAULT_CONFIG) as any;
    tmpConfig._id = '0';
    tmpConfig.invoiceConfig.businessFees.support.nfPercentage = Fees.NF_SUPPORT;
    tmpConfig.invoiceConfig.businessFees.support.organizationPercentage = Fees.NORTAN_SUPPORT;
    tmpConfig.invoiceConfig.businessFees.intermediation.nfPercentage = Fees.NF_INTERMEDIATION;
    tmpConfig.invoiceConfig.businessFees.intermediation.organizationPercentage = Fees.NORTAN_INTERMEDIATION;
    tmpConfig.oneDriveConfig.isActive = true;
    tmpConfig.oneDriveConfig.contracts = {
      oneDriveId: '0',
      folderId: '1',
    };
    mockedConfigs = [tmpConfig];

    const teamReq = httpMock.expectOne('/api/team/all');
    expect(teamReq.request.method).toBe('POST');
    teamReq.flush(mockedTeams);

    const configReq = httpMock.expectOne('/api/config/all');
    expect(configReq.request.method).toBe('POST');
    configReq.flush(mockedConfigs);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveTransaction should work', (done: DoneFn) => {
    const tmpTransaction = new Transaction();
    tmpTransaction._id = '4';
    tmpTransaction.author = '1';
    tmpTransaction.contract = '0';
    tmpTransaction.costCenter = '100'; // Id do time
    tmpTransaction.description = 'Ordem de empenho 02/02 do teste';
    tmpTransaction.nf = false;
    tmpTransaction.type = 'Receita';
    tmpTransaction.value = '1.000,00';
    tmpTransaction.notaFiscal = '15,00';
    tmpTransaction.nortanPercentage = '15,50';
    tmpTransaction.paid = true;
    tmpTransaction.paidDate = tmpTransaction.created;
    tmpTransaction.code = '#5';
    let i = 1;
    const data = {
      ns: {
        coll: 'transactions',
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
            expect(transactions.length).toBe(4);
            expect(transactions).toEqual(reviveDates(mockedTransactions));
            service.saveTransaction(tmpTransaction);
            const req1 = httpMock.expectOne('/api/transaction/');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(transactions.length).toBe(5);
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
    const req = httpMock.expectOne('/api/transaction/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedTransactions);
    }, 50);
  });

  it('saveManyTransaction should work', (done: DoneFn) => {
    const tmpTransaction1 = new Transaction();
    tmpTransaction1._id = '4';
    tmpTransaction1.author = '1';
    tmpTransaction1.contract = '0';
    tmpTransaction1.costCenter = '100'; // Id do time
    tmpTransaction1.description = 'Ordem de empenho 02/02 do teste';
    tmpTransaction1.nf = false;
    tmpTransaction1.type = 'Receita';
    tmpTransaction1.value = '1.000,00';
    tmpTransaction1.notaFiscal = '15,00';
    tmpTransaction1.nortanPercentage = '15,50';
    tmpTransaction1.paid = true;
    tmpTransaction1.paidDate = tmpTransaction1.created;
    tmpTransaction1.code = '#5';
    const tmpTransaction2 = cloneDeep(tmpTransaction1);
    tmpTransaction2._id = '5';
    tmpTransaction2.code = '#6';
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
            expect(transactions.length).toBe(4);
            expect(transactions).toEqual(reviveDates(mockedTransactions));
            service.saveManyTransaction([tmpTransaction1, tmpTransaction2]);
            reqSave = httpMock.expectOne('/api/transaction/many');
            expect(reqSave.request.method).toBe('POST');
            reqSave.flush(null);
            socket.emit('dbchange', {
              ns: {
                coll: 'transactions',
              },
              operationType: 'insert',
              fullDocument: reqSave.request.body.transactions[0],
            });
            break;
          }
          case 3: {
            i += 1;
            expect(transactions.length).toBe(5);
            socket.emit('dbchange', {
              ns: {
                coll: 'transactions',
              },
              operationType: 'insert',
              fullDocument: reqSave.request.body.transactions[1],
            });
            break;
          }
          case 4: {
            expect(transactions.length).toBe(6);
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
    const req = httpMock.expectOne('/api/transaction/all');
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
        coll: 'transactions',
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
            expect(transactions.length).toBe(4);
            expect(transactions).toEqual(reviveDates(mockedTransactions));
            service.editTransaction(tmpTransaction, editionHistoryItem);
            const req1 = httpMock.expectOne('/api/transaction/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(transactions.length).toBe(4);
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
    const req = httpMock.expectOne('/api/transaction/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedTransactions);
    }, 50);
  });

  baseTest('getTransactions should work', (expectedTransactions: Transaction[]) => {});
});
