import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';
import { cloneDeep } from 'lodash';
import { of, Subject, take } from 'rxjs';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';

import { externalMockedChecklistItems } from '../mocked-data/mocked-checklist-items';
import { externalMockedCompanies } from '../mocked-data/mocked-companies';
import { externalMockedConfigs } from '../mocked-data/mocked-config';
import { externalMockedContracts } from '../mocked-data/mocked-contracts';
import { externalMockedInvoices } from '../mocked-data/mocked-invoices';
import { externalMockedTeams } from '../mocked-data/mocked-teams';
import { externalMockedUsers } from '../mocked-data/mocked-users';
import { CONTRACT_STATOOS, ContractService } from './contract.service';
import { UserService } from './user.service';
import { WebSocketService } from './web-socket.service';
import { AuthService } from 'app/auth/auth.service';
import { reviveDates } from 'app/shared/utils';

import { Contract, ContractChecklistItem } from '@models/contract';
import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { Team } from '@models/team';
import { User } from '@models/user';

describe('ContractService', () => {
  let service: ContractService;
  let userService: UserService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  let mockedInvoices: Invoice[];
  let mockedContracts: Contract[];
  let mockedTeams: Team[];
  let mockedConfigs: PlatformConfig[];
  let mockedChecklistItem: ContractChecklistItem[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
    isCompanyLoaded$: of(true),
    companyId: externalMockedCompanies[0]._id,
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);

  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedContracts: Contract[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getContracts()
        .pipe(take(2))
        .subscribe((contracts) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(contracts.length).toBe(0);
              break;
            }
            case 2: {
              i += 1;
              const expectedContracts = reviveDates(mockedContracts);
              expect(contracts.length).toBe(3);
              expect(contracts).toEqual(expectedContracts);
              test(expectedContracts);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/contract/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedContracts);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue(externalMockedUsers[0].email);
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(ContractService);
    userService = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);

    mockedTeams = cloneDeep(externalMockedTeams);
    mockedUsers = cloneDeep(externalMockedUsers);
    mockedInvoices = cloneDeep(externalMockedInvoices);
    mockedContracts = cloneDeep(externalMockedContracts);
    mockedChecklistItem = cloneDeep(externalMockedChecklistItems);
    mockedConfigs = cloneDeep(externalMockedConfigs);

    userService.getUsers().pipe(take(1)).subscribe();
    // mock response
    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedUsers);

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

  it('saveContract should work', (done: DoneFn) => {
    const baseInvoice = new Invoice();
    baseInvoice._id = '2';
    baseInvoice.author = mockedUsers[0];
    baseInvoice.nortanTeam = '0';
    baseInvoice.sector = '0';
    baseInvoice.code = 'ORC-3/2021-NRT/T-00';
    baseInvoice.contractor = '0';
    mockedInvoices.push(baseInvoice);
    const tmpContract = new Contract();
    tmpContract._id = '2';
    tmpContract.invoice = mockedInvoices[2];
    tmpContract.status = CONTRACT_STATOOS.EM_ANDAMENTO;
    let i = 1;
    const data = {
      ns: {
        coll: 'contracts',
      },
      operationType: 'insert',
      fullDocument: tmpContract,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getContracts()
      .pipe(take(3))
      .subscribe((contracts) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(contracts.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(contracts.length).toBe(3);
            expect(contracts).toEqual(reviveDates(mockedContracts));
            service.saveContract(mockedInvoices[2]);
            const req1 = httpMock.expectOne('/api/contract/');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);

            const queryModelFolderURI =
              'https://graph.microsoft.com/v1.0/drives/' +
              mockedConfigs[0].oneDriveConfig.contracts.oneDriveId +
              '/items/' +
              mockedConfigs[0].oneDriveConfig.contracts.oneDriveId +
              '!' +
              mockedConfigs[0].oneDriveConfig.contracts.folderId +
              ':/testPath/01-Em Andamento/ORC-000_ANO-NOME DO CONTRATO-GESTOR';

            const req2 = httpMock.expectOne(queryModelFolderURI);
            expect(req2.request.method).toBe('GET');
            const folderMetaData = {
              parentReference: {
                driveId: mockedConfigs[0].oneDriveConfig.contracts.oneDriveId,
                id: mockedConfigs[0].oneDriveConfig.contracts.folderId,
              },
              id: '2',
            };

            req2.flush(folderMetaData);

            const req3 = httpMock.expectOne(
              'https://graph.microsoft.com/v1.0/drives/' +
                folderMetaData.parentReference.driveId +
                '/items/' +
                folderMetaData.id +
                '/copy'
            );
            expect(req3.request.method).toBe('POST');
            expect(req3.request.body.parentReference).toEqual(folderMetaData.parentReference);
            req3.flush(null);

            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(contracts.length).toBe(4);
            mockedContracts.push(tmpContract);
            expect(contracts).toEqual(reviveDates(mockedContracts));
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/contract/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedContracts);
    }, 50);
  });

  it('editContract should work', (done: DoneFn) => {
    const tmpContract = cloneDeep(mockedContracts[1]);
    tmpContract.status = CONTRACT_STATOOS.A_RECEBER;
    let i = 1;
    const data = {
      ns: {
        coll: 'contracts',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { status: CONTRACT_STATOOS.A_RECEBER },
        removedFields: [] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getContracts()
      .pipe(take(3))
      .subscribe((contracts) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(contracts.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(contracts.length).toBe(3);
            expect(contracts).toEqual(reviveDates(mockedContracts));
            service.editContract(tmpContract);
            const req1 = httpMock.expectOne('/api/contract/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(contracts.length).toBe(3);
            expect(contracts[1].status).toBe(CONTRACT_STATOOS.A_RECEBER);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/contract/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedContracts);
    }, 50);
  });

  baseTest('getContracts should work', (expectedContracts: Contract[]) => {});

  baseTest('idToContract should work', (expectedContracts: Contract[]) => {
    expect(service.idToContract('0')).toEqual(expectedContracts[0]);
    expect(service.idToContract(expectedContracts[0])).toEqual(expectedContracts[0]);
    expect(service.idToContract('1')).toEqual(expectedContracts[1]);
    expect(service.idToContract(expectedContracts[1])).toEqual(expectedContracts[1]);
  });

  baseTest('hasReceipts should work', (expectedContracts: Contract[]) => {
    expect(service.hasReceipts('0')).toBe(false);
    expect(service.hasReceipts(expectedContracts[0])).toBe(false);
    expect(service.hasReceipts('1')).toBe(true);
    expect(service.hasReceipts(expectedContracts[1])).toBe(true);
  });

  baseTest('hasPayments should work', (expectedContracts: Contract[]) => {
    expect(service.hasPayments('0')).toBe(false);
    expect(service.hasPayments(expectedContracts[0])).toBe(false);
    expect(service.hasPayments('1')).toBe(true);
    expect(service.hasPayments(expectedContracts[1])).toBe(true);
  });

  baseTest('hasExpenses should work', (expectedContracts: Contract[]) => {
    expect(service.hasExpenses('0')).toBe(true);
    expect(service.hasExpenses(expectedContracts[0])).toBe(true);
    expect(service.hasExpenses('1')).toBe(false);
    expect(service.hasExpenses(expectedContracts[1])).toBe(false);
  });

  it('balance should work', () => {
    expect(service.balance(mockedContracts[0])).toBe(mockedContracts[0].locals.balance);
    expect(service.balance(mockedContracts[1])).toBe(mockedContracts[1].locals.balance);
  });

  it('netValueBalance should work', () => {
    expect(service.netValueBalance(mockedInvoices[0].team[0].distribution, mockedContracts[0], mockedUsers[0])).toBe(
      '1.344,76'
    );
    expect(service.netValueBalance(mockedInvoices[0].team[1].distribution, mockedContracts[0], '1')).toBe('229,84');
    expect(service.netValueBalance(mockedInvoices[1].team[0].distribution, mockedContracts[1], '0')).toBe('964,32');
    expect(service.netValueBalance(mockedInvoices[1].team[1].distribution, mockedContracts[1], mockedUsers[1])).toBe(
      '642,88'
    );
  });

  it('expensesContributions should work', () => {
    let expensesContributions = service.expensesContributions(mockedContracts[0], mockedUsers[0]);
    expect(expensesContributions.user).toEqual({ expense: 0, contribution: 1000, cashback: 0, comission: 0 });
    expect(expensesContributions.global).toEqual({ expense: 200, contribution: 1000, cashback: 0, comission: 200 });
    expensesContributions = service.expensesContributions(mockedContracts[1]);
    expect(expensesContributions.user).toEqual({ expense: 0, contribution: 0, cashback: 0, comission: 0 });
    expect(expensesContributions.global).toEqual({ expense: 0, contribution: 0, cashback: 0, comission: 0 });
  });

  it('percentageToReceive should work', (done: DoneFn) => {
    setTimeout(() => {
      expect(
        service.percentageToReceive(mockedInvoices[0].team[0].distribution, mockedUsers[0], mockedContracts[0])
      ).toBe('85,40');
      expect(service.percentageToReceive(mockedInvoices[0].team[1].distribution, '1', mockedContracts[0])).toBe(
        '14,60'
      );
      expect(service.percentageToReceive(mockedInvoices[1].team[0].distribution, '0', mockedContracts[1])).toBe(
        '44,38'
      );
      expect(
        service.percentageToReceive(mockedInvoices[1].team[1].distribution, mockedUsers[1], mockedContracts[1])
      ).toBe('55,62');
      done();
    }, 100);
  });

  it('receivedValue should work', () => {
    expect(service.receivedValue(mockedUsers[0], mockedContracts[0])).toBe('0,00');
    expect(service.receivedValue('1', mockedContracts[0])).toBe('0,00');
    expect(service.receivedValue('0', mockedContracts[1])).toBe('615,00');
    expect(service.receivedValue(mockedUsers[1], mockedContracts[1])).toBe('205,00');
  });

  it('notPaidValue should work', () => {
    expect(service.notPaidValue(mockedInvoices[0].team[0].distribution, mockedUsers[0], mockedContracts[0])).toBe(
      '1.344,76'
    );
    expect(service.notPaidValue(mockedInvoices[0].team[1].distribution, '1', mockedContracts[0])).toBe('229,84');
    expect(service.notPaidValue(mockedInvoices[1].team[0].distribution, '0', mockedContracts[1])).toBe('349,32');
    expect(service.notPaidValue(mockedInvoices[1].team[1].distribution, mockedUsers[1], mockedContracts[1])).toBe(
      '437,88'
    );
  });

  it('toGrossValue should work', () => {
    expect(service.toGrossValue('100,00', '0', '0')).toBe('100,00');
    expect(service.toGrossValue('1.000,00', '0,00', '0,00')).toBe('1.000,00');
    expect(service.toGrossValue('100.000,00', '8,5', '15,00')).toBe('128.576,02');
    expect(service.toGrossValue('1.000.000,00', '15,5', '17,00')).toBe('1.425.821,63');
  });

  it('toNetValue should work', () => {
    expect(service.toNetValue('100,00', '0', '0', new Date('2021/11/01'))).toBe('100,00');
    expect(service.toNetValue('1.000,00', '0,00', '0,00', new Date('2022/01/01'))).toBe('1.000,00');
    expect(service.toNetValue('128.576,02', '8,5', '15,00', new Date('2022/02/25'))).toBe('100.000,00');
    expect(service.toNetValue('1.425.821,63', '15,5', '17,00', new Date('2021/03/19'))).toBe('1.000.000,00');
    expect(service.toNetValue('1.503,76', '15,5', '18,00', new Date('2022/08/15'))).toBe('1.000,00');
  });

  it('subtractComissions should work', () => {
    expect(service.subtractComissions(mockedInvoices[0].value, mockedContracts[0])).toBe('800,00');
    expect(service.subtractComissions(mockedInvoices[1].value, mockedContracts[1])).toBe('2.000,00');
  });

  it('getComissionsSum should work', () => {
    expect(service.getComissionsSum(mockedContracts[0])).toBe(200);
    expect(service.getComissionsSum(mockedContracts[1])).toBe(0);
  });

  it('getMemberExpensesSum should work', () => {
    expect(service.getMemberExpensesSum(undefined, mockedContracts[0])).toBe('0,00');
    expect(service.getMemberExpensesSum(undefined, mockedContracts[1])).toBe('0,00');
    expect(service.getMemberExpensesSum('0', mockedContracts[0])).toBe('0,00');
    expect(service.getMemberExpensesSum('1', mockedContracts[1])).toBe('0,00');
    expect(service.getMemberExpensesSum(mockedUsers[0], mockedContracts[0])).toBe('0,00');
    expect(service.getMemberExpensesSum(mockedUsers[1], mockedContracts[1])).toBe('0,00');
  });

  it('getMemberBalance should work', () => {
    expect(service.getMemberBalance(undefined, mockedContracts[0])).toBe('0,00');
    expect(service.getMemberBalance(undefined, mockedContracts[1])).toBe('0,00');
    expect(service.getMemberBalance('0', mockedContracts[0])).toBe('0,00');
    expect(service.getMemberBalance('1', mockedContracts[1])).toBe('205,00');
    expect(service.getMemberBalance(mockedUsers[1], mockedContracts[0])).toBe('0,00');
    expect(service.getMemberBalance(mockedUsers[0], mockedContracts[1])).toBe('615,00');
  });

  it('checkEditPermission for invoice 0 should work', (done: DoneFn) => {
    service
      .checkEditPermission(mockedInvoices[0])
      .pipe(take(1))
      .subscribe((result: boolean) => {
        expect(result).toBe(true);
        done();
      });
  });

  it('checkEditPermission for invoice 1 should work', (done: DoneFn) => {
    service
      .checkEditPermission(mockedInvoices[1])
      .pipe(take(1))
      .subscribe((result: boolean) => {
        expect(result).toBe(false);
        done();
      });
  });

  it('actionsByContract should work', () => {
    expect(service.actionsByContract(mockedContracts[0])).toEqual(mockedChecklistItem[0].actionList);
    expect(service.actionsByContract(mockedContracts[1])).toEqual(mockedChecklistItem[1].actionList);
  });

  baseTest('allActions should work', (expectedContracts: Contract[]) => {
    const allMockedActions = mockedChecklistItem[0].actionList.concat(mockedChecklistItem[1].actionList);
    expect(service.allActions()).toEqual(JSON.parse(JSON.stringify(allMockedActions)));
  });

  it('receiptNetValue should work', () => {
    expect(service.receiptNetValue(mockedContracts[2].receipts[0])).toEqual('791,30');
    expect(service.receiptNetValue(mockedContracts[2].receipts[1])).toEqual('1.527,91');
    expect(service.receiptNetValue(mockedContracts[2].receipts[2])).toEqual('2.952,96');
  });
});
