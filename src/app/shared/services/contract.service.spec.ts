import { TestBed } from '@angular/core/testing';

import { ContractService, CONTRACT_STATOOS, SPLIT_TYPES } from './contract.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import {
  Contract,
  ContractReceipt,
  ContractExpense,
  ContractPayment,
  ContractChecklistItem,
  ChecklistItemAction,
} from '@models/contract';
import { HttpTestingController } from '@angular/common/http/testing';
import { Subject, take } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';

import MockedServerSocket from 'socket.io-mock';
import { cloneDeep } from 'lodash';
import { AuthService } from 'app/auth/auth.service';
import { Fees, reviveDates } from 'app/shared/utils';
import { ConfigService, EXPENSE_TYPES } from './config.service';
import { CONTRACT_BALANCE } from './user.service';
import { DEFAULT_CONFIG } from './config.service';
import { User } from '@models/user';
import { Invoice } from '@models/invoice';
import { Team, TeamMember } from '@models/team';
import { PlatformConfig } from '@models/platformConfig';
import { WebSocketService } from './web-socket.service';
import { externalMockedUsers } from '../mocked-data/mocked-users';

describe('ContractService', () => {
  let service: ContractService;
  let configService: ConfigService;
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
              expect(contracts.length).toBe(2);
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
    configService = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);

    mockedTeams = [];
    mockedUsers = cloneDeep(externalMockedUsers);
    mockedInvoices = [];
    mockedContracts = [];
    mockedChecklistItem = [];
    mockedConfigs = [];

    const tmpTeam = new Team();
    tmpTeam._id = '0';
    tmpTeam.name = 'test';
    tmpTeam.leader = '0';
    tmpTeam.purpose = 'Be tested';
    tmpTeam.abrev = 'T';
    tmpTeam.config.path = `test`;
    const tmpTeamMember = new TeamMember();
    tmpTeamMember.user = '0';
    tmpTeamMember.sectors = ['0'];
    tmpTeam.members.push(cloneDeep(tmpTeamMember));
    tmpTeamMember.user = '1';
    tmpTeamMember.sectors = ['1'];
    tmpTeam.members.push(cloneDeep(tmpTeamMember));
    mockedTeams.push(cloneDeep(tmpTeam));
    let tmpInvoice = new Invoice();
    tmpInvoice._id = '0';
    tmpInvoice.author = mockedUsers[0];
    tmpInvoice.nortanTeam = '6201b405329f446f16e1b404';
    tmpInvoice.sector = '0';
    tmpInvoice.code = 'ORC-84/2021-NRT/DAD-00';
    tmpInvoice.contractor = '0';
    tmpInvoice.value = '1.000,00';
    tmpInvoice.trello = true;
    tmpInvoice.team.push({
      user: '0',
      sector: '0',
      distribution: '60,00',
      locals: {
        grossValue: '480,00',
        netValue: '480,00',
      },
    });
    tmpInvoice.team.push({
      user: '1',
      sector: '1',
      distribution: '40,00',
      locals: {
        grossValue: '320,00',
        netValue: '320,00',
      },
    });
    mockedInvoices.push(cloneDeep(tmpInvoice));
    tmpInvoice = new Invoice();
    tmpInvoice._id = '1';
    tmpInvoice.author = mockedUsers[1];
    tmpInvoice.nortanTeam = '0';
    tmpInvoice.sector = '1';
    tmpInvoice.code = 'ORC-2/2021-NRT/DEC-00';
    tmpInvoice.contractor = '0';
    tmpInvoice.value = '2.000,00';
    tmpInvoice.administration = 'pessoal';
    tmpInvoice.trello = false;
    tmpInvoice.team.push({
      user: '1',
      sector: '0',
      distribution: '60,00',
      locals: {
        grossValue: '1.176,00',
        netValue: '976,08',
      },
    });
    tmpInvoice.team.push({
      user: '0',
      sector: '1',
      distribution: '40,00',
      locals: {
        grossValue: '784,00',
        netValue: '650,72',
      },
    });
    mockedInvoices.push(cloneDeep(tmpInvoice));
    let tmpContract = new Contract();
    tmpContract._id = '0';
    tmpContract.created = new Date('2021/09/14');
    tmpContract.invoice = mockedInvoices[0];
    tmpContract.locals.liquid = '574,60';
    tmpContract.locals.balance = '800,00';
    tmpContract.locals.notPaid = '718,25';
    tmpContract.locals.value = '1.000,00';
    let tmpExpense = new ContractExpense();
    tmpExpense.author = mockedUsers[0];
    tmpExpense.source = mockedUsers[0];
    tmpExpense.description = 'test';
    tmpExpense.nf = false;
    tmpExpense.type = EXPENSE_TYPES.APORTE;
    tmpExpense.splitType = SPLIT_TYPES.INDIVIDUAL;
    tmpExpense.value = '1.000,00';
    tmpExpense.paid = true;
    tmpExpense.code = '#0';
    tmpExpense.paidDate = new Date();
    tmpExpense.team.push({
      user: mockedUsers[0],
      value: '1.000,00',
      percentage: '100,00',
      sector: 'Trocar',
    });
    tmpContract.expenses.push(tmpExpense);
    tmpExpense = new ContractExpense();
    tmpExpense.author = mockedUsers[1];
    tmpExpense.source = CONTRACT_BALANCE;
    tmpExpense.description = 'test';
    tmpExpense.nf = false;
    tmpExpense.type = EXPENSE_TYPES.COMISSAO;
    tmpExpense.splitType = SPLIT_TYPES.PROPORCIONAL;
    tmpExpense.value = '200,00';
    tmpExpense.paid = true;
    tmpExpense.code = '#0';
    tmpExpense.paidDate = new Date();
    tmpExpense.team.push({
      user: mockedUsers[0],
      value: '120,00',
      percentage: '60,00',
      sector: 'Trocar',
    });
    tmpExpense.team.push({
      user: mockedUsers[1],
      value: '80,00',
      percentage: '40,00',
      sector: 'Trocar',
    });
    tmpContract.expenses.push(tmpExpense);
    tmpContract.expenses.push(new ContractExpense());

    let tmpChecklistItem = new ContractChecklistItem();
    let tmpChecklistItemAction = new ChecklistItemAction();
    tmpChecklistItemAction.name = 'testAction1';
    tmpChecklistItem.actionList.push(tmpChecklistItemAction);
    mockedChecklistItem.push(tmpChecklistItem);

    tmpChecklistItem = new ContractChecklistItem();
    tmpChecklistItemAction = new ChecklistItemAction();
    tmpChecklistItemAction.name = 'testAction2';
    tmpChecklistItem.actionList.push(tmpChecklistItemAction);
    mockedChecklistItem.push(tmpChecklistItem);

    tmpContract.checklist.push(cloneDeep(mockedChecklistItem[0]));

    mockedContracts.push(tmpContract);
    tmpContract = new Contract();
    tmpContract._id = '1';
    tmpContract.created = new Date('2021/09/14');
    tmpContract.ISS = '2,00';
    tmpContract.locals.liquid = '1.607,20';
    tmpContract.locals.balance = '0,00';
    tmpContract.locals.notPaid = '820,00';
    tmpContract.locals.value = '2.000,00';
    tmpContract.invoice = mockedInvoices[1];
    let tmpReceipt = new ContractReceipt();
    tmpReceipt.value = '1.000,00';
    tmpReceipt.notaFiscal = '0,00';
    tmpReceipt.nortanPercentage = '18,00';
    tmpReceipt.description = 'Teste';
    tmpReceipt.paid = true;
    tmpReceipt.paidDate = new Date();
    tmpContract.receipts.push(tmpReceipt);
    let tmpPayment = new ContractPayment();
    tmpPayment.service = 'test';
    tmpPayment.value = '410,00';
    tmpPayment.paid = true;
    tmpPayment.paidDate = new Date();
    tmpPayment.team.push({
      user: mockedUsers[0],
      sector: 'Trocar',
      value: '410,00',
      percentage: '100,00',
    });
    tmpContract.payments.push(tmpPayment);
    tmpPayment = new ContractPayment();
    tmpPayment.service = 'test';
    tmpPayment.value = '410,00';
    tmpPayment.paid = true;
    tmpPayment.paidDate = new Date();
    tmpPayment.team.push({
      user: mockedUsers[0],
      sector: 'Trocar',
      value: '205,00',
      percentage: '50,00',
    });
    tmpPayment.team.push({
      user: mockedUsers[1],
      sector: 'Trocar',
      value: '205,00',
      percentage: '50,00',
    });
    tmpContract.payments.push(tmpPayment);
    tmpContract.payments.push(new ContractPayment());
    tmpContract.checklist.push(cloneDeep(mockedChecklistItem[1]));

    mockedContracts.push(tmpContract);

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
    tmpConfig.oneDriveConfig.providers = {
      oneDriveId: '0',
      folderId: '1',
    };
    mockedConfigs = [tmpConfig];

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
            expect(contracts.length).toBe(2);
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
              ':/test/01-Em Andamento/ORC-000_ANO-NOME DO CONTRATO-GESTOR';

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
            expect(contracts.length).toBe(3);
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
            expect(contracts.length).toBe(2);
            expect(contracts).toEqual(reviveDates(mockedContracts));
            service.editContract(tmpContract);
            const req1 = httpMock.expectOne('/api/contract/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(contracts.length).toBe(2);
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
    expect(service.toNetValue('1.503,76', '15,5', '18,00', new Date('2022/03/25'))).toBe('1.000,00');
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
});
