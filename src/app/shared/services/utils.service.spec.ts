import { TestBed } from '@angular/core/testing';

import { UtilsService } from './utils.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { subMonths, addMonths, subYears, subDays } from 'date-fns';
import { range } from 'lodash';
import { Component } from '@angular/core';
import { User } from '@models/user';
import { Contract, ContractReceipt } from '@models/contract';
import { Invoice } from '@models/invoice';
import { TimeSeriesItem } from './metrics.service';

@Component({
  selector: 'test-cmp',
  template: `
    <div *ngFor="let item of items; trackBy: utils.trackByIndex">
      {{ item }}
    </div>
  `,
})
class TestComponent {
  value: any;
  items = range(1);
  constructor(public utils: UtilsService) {}
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
  let service: UtilsService;

  CommonTestingModule.setUpTestBed(TestComponent);

  beforeEach(() => {
    service = TestBed.inject(UtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('assingOrIncrement should work', () => {
    let test: {
      sum?: number;
    } = {};
    expect(test.sum).toBe(undefined);
    test.sum = service.assingOrIncrement(test.sum, 1);
    expect(test.sum).toBe(1.0);
    test.sum = service.assingOrIncrement(test.sum, 25);
    expect(test.sum).toBe(26.0);
    test.sum = service.assingOrIncrement(test.sum, -25);
    expect(test.sum).toBe(1.0);
  });

  it('isValidDate should work', () => {
    const date = new Date();
    expect(service.isValidDate(date)).toBe(true);
    expect(service.isValidDate(subMonths(date, 1))).toBe(false);
    expect(service.isValidDate(date, 'Dia')).toBe(true);
    expect(service.isValidDate(addMonths(date, 1), 'Dia')).toBe(false);
    expect(service.isValidDate(subMonths(date, 1), 'Mês')).toBe(true);
    expect(service.isValidDate(date, 'Mês')).toBe(false);
    expect(service.isValidDate(subYears(date, 1), 'Ano')).toBe(true);
    expect(service.isValidDate(date, 'Ano')).toBe(false);
    expect(service.isValidDate(subMonths(date, 2), 'Mês', 2)).toBe(true);
    expect(service.isValidDate(subDays(subMonths(date, 2), 1), 'Mês', 2, true)).toBe(false);
  });

  it('formatDate should work', () => {
    const date = new Date('Jun 17, 2021');
    expect(service.formatDate(date)).toBe('17/06/2021');
  });

  it('isWithinInterval should work', () => {
    const date = new Date('Jun 17, 2021');
    const start = new Date('Jun 01, 2021');
    const end = new Date('Jun 31, 2021');
    expect(service.isWithinInterval(date, start, end)).toBe(true);
    expect(service.isWithinInterval(addMonths(date, 1), start, end)).toBe(false);
    expect(service.isWithinInterval(date, addMonths(start, 1), addMonths(end, 1))).toBe(false);
    expect(service.isWithinInterval(date, subMonths(start, 1), subMonths(end, 1))).toBe(false);
    expect(service.isWithinInterval(date, subMonths(start, 1), end)).toBe(true);
    expect(service.isWithinInterval(date, start, addMonths(end, 1))).toBe(true);
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

    expect(service.groupByDateTimeSerie(case1)).toEqual(case1);
    expect(service.groupByDateTimeSerie(case2)).toEqual(case2);
    expect(service.groupByDateTimeSerie(case3)).toEqual(expectedCase3);
    expect(service.groupByDateTimeSerie(case4)).toEqual(expectedCase4);
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
    expect(service.trackByIndex(1, {})).toBe(1);
  });

  it('isOfType should work', () => {
    let test: TestComponent | User = new User();
    expect(service.isOfType<User>(test, ['position', 'expertise'])).toBe(true);
    expect(service.isOfType<TestComponent>(test, ['value', 'items'])).toBe(false);
  });

  it('nfPercentage should work', () => {
    const contract: Contract = new Contract();
    const invoice: Invoice = new Invoice();
    expect(service.nfPercentage(contract)).toBe('0');
    invoice._id = '0';
    invoice.author = '0';
    invoice.department = 'DEC';
    invoice.coordination = '';
    invoice.code = '';
    invoice.contractor = '0';
    contract.invoice = invoice;
    expect(service.nfPercentage(contract)).toBe('8,5');
    const receipt = new ContractReceipt();
    receipt.notaFiscal = '0,00';
    contract.receipts.push(receipt);
    expect(service.nfPercentage(contract)).toBe('0,00');
    expect(service.nfPercentage(invoice)).toBe('8,5');
    invoice.department = 'DPC';
    expect(service.nfPercentage(invoice)).toBe('15,5');
    invoice.administration = 'pessoal';
    expect(service.nfPercentage(invoice)).toBe('0');
  });

  it('nortanPercentage should work', () => {
    const contract: Contract = new Contract();
    const invoice: Invoice = new Invoice();
    expect(service.nortanPercentage(contract)).toBe('0');
    invoice._id = '0';
    invoice.author = '0';
    invoice.department = 'DEC';
    invoice.coordination = '';
    invoice.code = '';
    invoice.contractor = '0';
    contract.invoice = invoice;
    expect(service.nortanPercentage(contract)).toBe('15');
    const receipt = new ContractReceipt();
    receipt.nortanPercentage = '20,00';
    contract.receipts.push(receipt);
    expect(service.nortanPercentage(contract)).toBe('20,00');
    expect(service.nortanPercentage(invoice)).toBe('15');
    invoice.administration = 'pessoal';
    expect(service.nortanPercentage(invoice)).toBe('17');
    invoice.department = 'DAD';
    expect(service.nortanPercentage(invoice)).toBe('0');
  });

  it('isPhone should work', () => {
    service.mockDocument({ documentElement: { clientWidth: 300 } });
    expect(service.isPhone()).toBe(true);
    service.mockDocument({ documentElement: { clientWidth: 600 } });
    expect(service.isPhone()).toBe(true);
    service.mockDocument({ documentElement: { clientWidth: 900 } });
    expect(service.isPhone()).toBe(false);
  });

  it('valueSort should work', () => {
    expect(service.valueSort(1, '1', '2')).toBe(-1);
    expect(service.valueSort(1, '2', '1')).toBe(1);
    expect(service.valueSort(1, '1', '1')).toBe(0);
  });
});
