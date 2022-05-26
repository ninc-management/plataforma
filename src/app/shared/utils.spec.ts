import { TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'app/../common-testing.module';
import { subMonths, addMonths, subYears, subDays } from 'date-fns';
import { cloneDeep, range } from 'lodash';
import { Component } from '@angular/core';
import { User } from '@models/user';
import { Contract, ContractReceipt } from '@models/contract';
import { Invoice } from '@models/invoice';
import { Team, TeamMember } from '@models/team';
import { TimeSeriesItem } from './services/metrics.service';
import { InvoiceService } from './services/invoice.service';
import { UserService } from './services/user.service';
import { TeamService } from './services/team.service';
import { ContractService } from './services/contract.service';
import { take } from 'rxjs';
import { HttpTestingController } from '@angular/common/http/testing';
import { ContractorService } from './services/contractor.service';
import { Contractor } from '@models/contractor';
import {
  assingOrIncrement,
  elapsedTime,
  formatDate,
  groupByDateTimeSerie,
  idToProperty,
  isOfType,
  isPhone,
  isValidDate,
  isWithinInterval,
  mockDocument,
  nfPercentage,
  nortanPercentage,
  reviveDates,
  trackByIndex,
  valueSort,
} from './utils';

@Component({
  selector: 'test-cmp',
  template: `
    <div *ngFor="let item of items; trackBy: trackByIndex">
      {{ item }}
    </div>
  `,
})
class TestComponent {
  value: any;
  items = range(1);
  constructor() {}
}

function elementText(n: any): string {
  if (n instanceof Array) {
    return n.map(elementText).join('');
  }
  if (n.nodeType === Node.COMMENT_NODE) {
    return '';
  }
  if (n.nodeType === Node.ELEMENT_NODE && n.hasChildNodes()) {
    return elementText(Array.prototype.slice.call(n.childNodes));
  }
  if (n.nativeElement) {
    n = n.nativeElement;
  }
  return n.textContent;
}

describe('UtilsService', () => {
  let httpMock: HttpTestingController;
  let invoiceService: InvoiceService;
  let userService: UserService;
  let teamService: TeamService;
  let contractService: ContractService;
  let contractorService: ContractorService;

  let mockedUsers: User[];
  let mockedInvoices: Invoice[];
  let mockedTeams: Team[];
  let mockedContracts: Contract[];
  let mockedContractors: Contractor[];

  CommonTestingModule.setUpTestBed(TestComponent);

  beforeEach(() => {
    invoiceService = TestBed.inject(InvoiceService);
    userService = TestBed.inject(UserService);
    teamService = TestBed.inject(TeamService);
    contractService = TestBed.inject(ContractService);
    contractorService = TestBed.inject(ContractorService);
    httpMock = TestBed.inject(HttpTestingController);

    mockedUsers = [];
    mockedInvoices = [];
    mockedTeams = [];
    mockedContracts = [];
    mockedContractors = [];

    const tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.fullName = 'Test1';
    tmpUser.email = 'test1@te.st';
    tmpUser.phone = '123456';
    tmpUser.profilePicture = 'pic1@pic.com';
    mockedUsers.push(cloneDeep(tmpUser));

    const tmpTeam = new Team();
    tmpTeam._id = '0';
    tmpTeam.name = 'test';
    tmpTeam.leader = '0';
    tmpTeam.purpose = 'Be tested';
    tmpTeam.abrev = 'T';
    tmpTeam.config.path = `test`;
    const tmpTeamMember = new TeamMember();
    tmpTeamMember.user = mockedUsers[0];
    tmpTeamMember.sector = '0';
    tmpTeam.members.push(cloneDeep(tmpTeamMember));
    tmpTeamMember.user = '1';
    tmpTeamMember.sector = '1';
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
    mockedInvoices.push(cloneDeep(tmpInvoice));

    let tmpContract = new Contract();
    tmpContract._id = '0';
    tmpContract.invoice = mockedInvoices[0];
    tmpContract.liquid = '676,00';
    tmpContract.balance = '800,00';
    tmpContract.notPaid = '845,00';
    tmpContract.value = '1.000,00';
    mockedContracts.push(cloneDeep(tmpContract));

    const tmpContractor = new Contractor();
    tmpContractor._id = '0';
    tmpContractor.address = 'rua teste1';
    tmpContractor.document = '000.000.000-11';
    tmpContractor.email = 'test1@te.st';
    tmpContractor.fullName = 'Test1';
    tmpContractor.phone = '(00) 0000-0000';
    mockedContractors.push(cloneDeep(tmpContractor));

    teamService.getTeams().pipe(take(1)).subscribe();
    let req = httpMock.expectOne('/api/team/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedTeams);

    userService.getUsers().pipe(take(1)).subscribe();
    req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedUsers);

    invoiceService.getInvoices().pipe(take(1)).subscribe();
    req = httpMock.expectOne('/api/invoice/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedInvoices);

    contractService.getContracts().pipe(take(1)).subscribe();
    req = httpMock.expectOne('/api/contract/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedContracts);

    contractorService.getContractors().pipe(take(1)).subscribe();
    req = httpMock.expectOne('/api/contractor/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedContractors);
  });

  it('assingOrIncrement should work', () => {
    let test: {
      sum?: number;
    } = {};
    expect(test.sum).toBe(undefined);
    test.sum = assingOrIncrement(test.sum, 1);
    expect(test.sum).toBe(1.0);
    test.sum = assingOrIncrement(test.sum, 25);
    expect(test.sum).toBe(26.0);
    test.sum = assingOrIncrement(test.sum, -25);
    expect(test.sum).toBe(1.0);
  });

  it('isValidDate should work', () => {
    const date = new Date();
    expect(isValidDate(date)).toBe(true);
    expect(isValidDate(subMonths(date, 1))).toBe(false);
    expect(isValidDate(date, 'Dia')).toBe(true);
    expect(isValidDate(addMonths(date, 1), 'Dia')).toBe(false);
    expect(isValidDate(subMonths(date, 1), 'Mês')).toBe(true);
    expect(isValidDate(date, 'Mês')).toBe(false);
    expect(isValidDate(subYears(date, 1), 'Ano')).toBe(true);
    expect(isValidDate(date, 'Ano')).toBe(false);
    expect(isValidDate(subMonths(date, 2), 'Mês', 2)).toBe(true);
    expect(isValidDate(subDays(subMonths(date, 2), 1), 'Mês', 2, true)).toBe(false);
  });

  it('formatDate should work', () => {
    const date = new Date('Jun 17, 2021');
    expect(formatDate(date)).toBe('17/06/2021');
    expect(formatDate(date, '')).toBe('17062021');
    expect(formatDate(date, '-')).toBe('17-06-2021');
  });

  it('isWithinInterval should work', () => {
    const date = new Date('Jun 17, 2021');
    const start = new Date('Jun 01, 2021');
    const end = new Date('Jun 31, 2021');
    expect(isWithinInterval(date, start, end)).toBe(true);
    expect(isWithinInterval(addMonths(date, 1), start, end)).toBe(false);
    expect(isWithinInterval(date, addMonths(start, 1), addMonths(end, 1))).toBe(false);
    expect(isWithinInterval(date, subMonths(start, 1), subMonths(end, 1))).toBe(false);
    expect(isWithinInterval(date, subMonths(start, 1), end)).toBe(true);
    expect(isWithinInterval(date, start, addMonths(end, 1))).toBe(true);
  });

  it('groupByDateTimeSerie should work', () => {
    const case1: TimeSeriesItem[] = [];
    const case2: TimeSeriesItem[] = [
      ['2021/01/01', 200],
      ['2021/01/02', 300],
    ];
    const case3: TimeSeriesItem[] = [
      ['2021/01/01', 200],
      ['2021/01/01', 100],
      ['2021/01/02', 300],
    ];
    const expectedCase3: TimeSeriesItem[] = [
      ['2021/01/01', 300],
      ['2021/01/02', 300],
    ];
    const case4: TimeSeriesItem[] = [
      ['2021/01/01', 100],
      ['2021/01/02', 200],
      ['2021/01/03', 300],
      ['2021/01/02', 100],
    ];
    const expectedCase4: TimeSeriesItem[] = [
      ['2021/01/01', 100],
      ['2021/01/02', 300],
      ['2021/01/03', 300],
    ];

    expect(groupByDateTimeSerie(case1)).toEqual(case1);
    expect(groupByDateTimeSerie(case2)).toEqual(case2);
    expect(groupByDateTimeSerie(case3)).toEqual(expectedCase3);
    expect(groupByDateTimeSerie(case4)).toEqual(expectedCase4);
  });

  it('trackByIndex should work', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.items = range(5);
    fixture.detectChanges();
    fixture.componentInstance.items = range(5, 10);
    fixture.detectChanges();
    fixture.componentInstance.items = range(10, 15);
    fixture.detectChanges();
    expect(elementText(fixture.nativeElement)).toBe(' 10  11  12  13  14 ');
    expect(trackByIndex(1, {})).toBe(1);
  });

  it('isOfType should work', () => {
    let test: TestComponent | User = new User();
    expect(isOfType<User>(test, ['position', 'expertise'])).toBe(true);
    expect(isOfType<TestComponent>(test, ['value', 'items'])).toBe(false);
  });

  it('nfPercentage should work', () => {
    const contract: Contract = new Contract();
    const invoice: Invoice = new Invoice();
    expect(nfPercentage(contract)).toBe('0');
    invoice._id = '0';
    invoice.author = '0';
    invoice.nortanTeam = '61362107f04ddc1a6a59f390';
    invoice.sector = '';
    invoice.code = '';
    invoice.contractor = '0';
    contract.invoice = invoice;
    expect(nfPercentage(contract)).toBe('8,5');
    const receipt = new ContractReceipt();
    receipt.notaFiscal = '0,00';
    contract.receipts.push(receipt);
    expect(nfPercentage(contract)).toBe('0,00');
    invoice.nortanTeam = '614b58d90d2cf0435ea59e52';
    expect(nfPercentage(invoice)).toBe('8,5');
    invoice.nortanTeam = '613236a07f6ed15db318c7d8';
    expect(nfPercentage(invoice)).toBe('8,5');
    invoice.nortanTeam = '0';
    expect(nfPercentage(invoice)).toBe('15,5');
    invoice.administration = 'pessoal';
    expect(nfPercentage(invoice)).toBe('0');
  });

  it('nortanPercentage should work', () => {
    const contract: Contract = new Contract();
    const invoice: Invoice = new Invoice();
    expect(nortanPercentage(contract)).toBe('0');
    invoice._id = '0';
    invoice.author = '0';
    invoice.nortanTeam = '0';
    invoice.sector = '';
    invoice.code = '';
    invoice.contractor = '0';
    contract.invoice = invoice;
    expect(nortanPercentage(contract)).toBe('15');
    const receipt = new ContractReceipt();
    receipt.nortanPercentage = '20,00';
    contract.receipts.push(receipt);
    expect(nortanPercentage(contract)).toBe('20,00');
    invoice.nortanTeam = '1';
    expect(nortanPercentage(invoice)).toBe('15');
    invoice.administration = 'pessoal';
    expect(nortanPercentage(invoice)).toBe('18');
    invoice.nortanTeam = '6201b405329f446f16e1b404';
    expect(nortanPercentage(invoice)).toBe('0');
  });

  it('isPhone should work', () => {
    mockDocument({ documentElement: { clientWidth: 300 } });
    expect(isPhone()).toBe(true);
    mockDocument({ documentElement: { clientWidth: 600 } });
    expect(isPhone()).toBe(true);
    mockDocument({ documentElement: { clientWidth: 900 } });
    expect(isPhone()).toBe(false);
  });

  it('valueSort should work', () => {
    expect(valueSort(1, '1', '2')).toBe(-1);
    expect(valueSort(1, '2', '1')).toBe(1);
    expect(valueSort(1, '1', '1')).toBe(0);
    expect(valueSort(-1, '1', '2')).toBe(1);
    expect(valueSort(-1, '2', '1')).toBe(-1);
    expect(valueSort(-1, '1', '1')).toBe(0);
    expect(valueSort(1, '21.300,01', '21.300,02')).toBe(-1);
    expect(valueSort(1, '21.300,20', '21.300,10')).toBe(1);
    expect(valueSort(1, '21.310,00', '21.310,00')).toBe(0);
    expect(valueSort(-1, '21.300,01', '21.300,02')).toBe(1);
    expect(valueSort(-1, '21.300,20', '21.300,10')).toBe(-1);
    expect(valueSort(-1, '21.310,00', '21.310,00')).toBe(0);
  });

  it('idToProperty should work', () => {
    expect(idToProperty(undefined, invoiceService.idToInvoice.bind(invoiceService), 'code')).toBe('');
    expect(idToProperty(mockedInvoices[0]._id, invoiceService.idToInvoice.bind(invoiceService), 'code')).toBe(
      mockedInvoices[0].code
    );
    expect(idToProperty(mockedInvoices[0], invoiceService.idToInvoice.bind(invoiceService), 'author')).toEqual(
      mockedUsers[0]
    );
    expect(idToProperty(undefined, userService.idToUser.bind(userService), 'profilePicture')).toBe('');
    expect(idToProperty(mockedUsers[0]._id, userService.idToUser.bind(userService), 'fullName')).toBe(
      mockedUsers[0].fullName
    );
    expect(idToProperty(mockedUsers[0], userService.idToUser.bind(userService), 'phone')).toBe(mockedUsers[0].phone);
    expect(idToProperty(undefined, teamService.idToTeam.bind(teamService), 'purpose')).toBe('');
    expect(idToProperty(mockedTeams[0]._id, teamService.idToTeam.bind(teamService), 'purpose')).toBe(
      mockedTeams[0].purpose
    );
    expect(idToProperty(mockedTeams[0], teamService.idToTeam.bind(teamService), 'abrev')).toBe(mockedTeams[0].abrev);
    expect(idToProperty(undefined, contractService.idToContract.bind(contractService), 'name')).toBe('');
    expect(idToProperty(mockedContracts[0]._id, contractService.idToContract.bind(contractService), 'name')).toBe(
      mockedContracts[0].name
    );
    expect(idToProperty(mockedContracts[0], contractService.idToContract.bind(contractService), 'value')).toBe(
      mockedContracts[0].value
    );
    expect(idToProperty(undefined, contractorService.idToContractor.bind(contractorService), 'fullName')).toBe('');
    expect(
      idToProperty(mockedContractors[0]._id, contractorService.idToContractor.bind(contractorService), 'fullName')
    ).toBe(mockedContractors[0].fullName);
    expect(
      idToProperty(mockedContractors[0], contractorService.idToContractor.bind(contractorService), 'document')
    ).toBe(mockedContractors[0].document);
  });

  it('elapsedTime should work', () => {
    expect(elapsedTime(new Date('2022/04/11 23:59:00'), new Date('2022/04/13 00:00:00'))).toBe('há 1 dia');
    expect(elapsedTime(new Date(2022, 4, 11, 23, 59, 0), new Date(2022, 4, 13, 0, 0, 0))).toBe('há 1 dia');
    expect(elapsedTime(new Date('2022/04/10 23:59:00'), new Date('2022/04/13 00:00:00'))).toBe('há 2 dias');
    expect(elapsedTime(new Date('2022/04/12 20:00:00'), new Date('2022/04/12 21:00:00'))).toBe('há 1 hora atrás');
    expect(elapsedTime(new Date(2022, 4, 12, 20, 0, 0), new Date(2022, 4, 12, 21, 0, 0))).toBe('há 1 hora atrás');
    expect(elapsedTime(new Date('2022/04/12 18:00:00'), new Date('2022/04/12 22:00:00'))).toBe('há 4 horas atrás');
    expect(elapsedTime(new Date('2022/04/12 20:00:00'), new Date('2022/04/12 20:01:00'))).toBe('há 1 minuto atrás');
    expect(elapsedTime(new Date(2022, 4, 12, 20, 0, 0), new Date(2022, 4, 12, 20, 1, 0))).toBe('há 1 minuto atrás');
    expect(elapsedTime(new Date('2022/04/12 20:05:00'), new Date('2022/04/12 20:10:00'))).toBe('há 5 minutos atrás');
    expect(elapsedTime(new Date('2022/04/12 20:00:00'), new Date('2022/04/12 20:00:01'))).toBe('há 1 segundo atrás');
    expect(elapsedTime(new Date(2022, 4, 12, 20, 0, 0), new Date(2022, 4, 12, 20, 0, 1))).toBe('há 1 segundo atrás');
    expect(elapsedTime(new Date('2022/04/12 20:00:00'), new Date('2022/04/12 20:00:02'))).toBe('há 2 segundos atrás');
  });

  it('reviveDates should work', () => {
    // keys in revival keys list
    const test1 = {
      created: new Date(),
    };
    // keys not in revival keys list that aren't Date type
    const test2 = {
      created: new Date(),
      sent: 1,
    };
    // keys not in revival keys list that are Date type
    const test3 = {
      created: new Date(),
      sent: new Date(),
    };

    expect(reviveDates(JSON.parse(JSON.stringify(test1)))).toEqual(test1);
    expect(reviveDates(test1)).toEqual(test1);
    expect(reviveDates(JSON.parse(JSON.stringify(test2)))).toEqual(test2);
    expect(reviveDates(test2)).toEqual(test2);
    expect(reviveDates(JSON.parse(JSON.stringify(test3)))).not.toEqual(test3);
    expect(reviveDates(test3)).not.toEqual(test3);
  });
});