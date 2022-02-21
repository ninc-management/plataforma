import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map, take, filter } from 'rxjs/operators';
import { ContractService, CONTRACT_STATOOS } from './contract.service';
import { ContractorService } from './contractor.service';
import { InvoiceService, INVOICE_STATOOS } from './invoice.service';
import { UserService, CONTRACT_BALANCE, CLIENT } from './user.service';
import { DepartmentService } from './department.service';
import { StringUtilService } from './string-util.service';
import { UtilsService } from './utils.service';
import { NortanService } from './nortan.service';
import { cloneDeep, mergeWith, add } from 'lodash';
import { format } from 'date-fns';

export type TimeSeriesItem = [string, number];

/* eslint-disable @typescript-eslint/indent */
// prettier-ignore
export interface TimeSeries {
  name: string;
  type: 'line' | 'bar' | 'boxplot' | 'candlestick' | 'parallel';
  smooth: boolean;
  cumulative: boolean;
  symbol:
    | 'circle'
    | 'rect'
    | 'roundRect'
    | 'triangle'
    | 'diamond'
    | 'pin'
    | 'arrow'
    | 'none';
  barGap?: string;
  barMaxWidth?: number | string;
  isMoney?: boolean;
  data: TimeSeriesItem[];
}
/* eslint-enable @typescript-eslint/indent */

interface MetricInfo {
  count: number;
  value: number;
}

interface UserAndGlobalMetric {
  user: number;
  global: number;
}

// Sorted alphabetically
interface Coordinations {
  CADM: number;
  CDI: number;
  CGO: number;
  CIMP: number;
  CINST: number;
  CMA: number;
  CPA: number;
  CRH: number;
  CSE: number;
  CSEST: number;
  CSH: number;
}

interface FilteredCoordinations {
  CADM?: number;
  CDI?: number;
  CGO?: number;
  CIMP?: number;
  CINST?: number;
  CMA?: number;
  CPA?: number;
  CRH?: number;
  CSE?: number;
  CSEST?: number;
  CSH?: number;
}

interface UserAndCoordinations {
  user: Coordinations;
  global: Coordinations;
}

interface FilteredUserAndCoordinations {
  user: FilteredCoordinations;
  global: FilteredCoordinations;
}

// Department-coordination.json file order
interface Departments {
  DAD: number;
  DEC: number;
  DAQ: number;
  DPC: number;
  DRM: number;
}

interface FilteredDepartments {
  DAD?: number;
  DEC?: number;
  DAQ?: number;
  DPC?: number;
  DRM?: number;
}

interface FilteredUserAndDepartments {
  user: FilteredDepartments;
  global: FilteredDepartments;
}

interface UserAndDepartments {
  user: Departments;
  global: Departments;
}

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  destroy$ = new Subject<void>();

  private defaultCoordsValue: Coordinations = {
    CADM: 0,
    CDI: 0,
    CGO: 0,
    CIMP: 0,
    CINST: 0,
    CMA: 0,
    CPA: 0,
    CRH: 0,
    CSE: 0,
    CSEST: 0,
    CSH: 0,
  };

  private defaultDepartments: Departments = {
    DAD: 0,
    DEC: 0,
    DAQ: 0,
    DPC: 0,
    DRM: 0,
  };

  private defaultUserCoordValue: UserAndCoordinations = {
    user: Object.assign({}, this.defaultCoordsValue),
    global: Object.assign({}, this.defaultCoordsValue),
  };

  private defaultUserDepartmentValue: UserAndDepartments = {
    user: Object.assign({}, this.defaultDepartments),
    global: Object.assign({}, this.defaultDepartments),
  };

  constructor(
    private contractService: ContractService,
    private contractorService: ContractorService,
    private nortanService: NortanService,
    private invoiceService: InvoiceService,
    private userService: UserService,
    private departmentService: DepartmentService,
    private stringUtil: StringUtilService,
    private utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  userDepartmentRepresentation(department: string, userDepartment: FilteredUserAndDepartments): string {
    const departmentsAbrevs = this.departmentService.buildDepartmentList().map((d) => d.slice(0, 3)); // DAD DEC DAQ DPC DRM
    switch (department) {
      case departmentsAbrevs[0]:
        return this.stringUtil.toPercentageNumber(userDepartment.user.DAD, userDepartment.global.DAD);
      case departmentsAbrevs[1]:
        return this.stringUtil.toPercentageNumber(userDepartment.user.DEC, userDepartment.global.DEC);
      case departmentsAbrevs[2]:
        return this.stringUtil.toPercentageNumber(userDepartment.user.DAQ, userDepartment.global.DAQ);
      case departmentsAbrevs[3]:
        return this.stringUtil.toPercentageNumber(userDepartment.user.DPC, userDepartment.global.DPC);
      case departmentsAbrevs[4]:
        return this.stringUtil.toPercentageNumber(userDepartment.user.DRM, userDepartment.global.DRM);
      default:
        return '';
    }
  }

  userCoordRepresentation(coord: string, userCoord: FilteredUserAndCoordinations): string {
    const coords = this.departmentService.buildAllCoordinationsList();
    switch (coord) {
      case coords[0]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CADM, userCoord.global.CADM);
      case coords[1]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CDI, userCoord.global.CDI);
      case coords[2]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CGO, userCoord.global.CGO);
      case coords[3]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CIMP, userCoord.global.CIMP);
      case coords[4]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CINST, userCoord.global.CINST);
      case coords[5]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CMA, userCoord.global.CMA);
      case coords[6]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CPA, userCoord.global.CPA);
      case coords[7]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CRH, userCoord.global.CRH);
      case coords[8]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CSE, userCoord.global.CSE);
      case coords[9]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CSEST, userCoord.global.CSEST);
      case coords[10]:
        return this.stringUtil.toPercentageNumber(userCoord.user.CSH, userCoord.global.CSH);
      default:
        return '';
    }
  }

  plural(last: string, number: number): string {
    switch (last) {
      case 'Dia': {
        return number > 1 ? 'Nos últimos ' + number + ' dias' : 'Ontem';
      }
      case 'Mês': {
        return number > 1 ? 'Nos últimos ' + number + ' meses' : 'No mês passado';
      }
      case 'Ano': {
        return number > 1 ? 'Nos últimos ' + number + ' anos' : 'No ano passado';
      }
      default: {
        return '';
      }
    }
  }

  contractsAsManger(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
              this.utils.isValidDate(created, last, number, fromToday)
            ) {
              const invoice = this.invoiceService.idToInvoice(contract.invoice);
              metricInfo.count += 1;
              metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesAsManger(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return this.invoiceService.getInvoices().pipe(
      filter((invoices) => invoices.length > 0),
      map((invoices) => {
        return invoices
          .filter((invoices) => invoices.status != INVOICE_STATOOS.INVALIDADO)
          .reduce(
            (metricInfo: MetricInfo, invoice) => {
              const created = invoice.created;
              if (
                this.invoiceService.isInvoiceAuthor(invoice, uId) &&
                this.utils.isValidDate(created, last, number, fromToday)
              ) {
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
              }
              return metricInfo;
            },
            { count: 0, value: 0 }
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  contractsAsMember(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceMember(contract.invoice, uId) &&
              this.utils.isValidDate(created, last, number, fromToday)
            ) {
              const invoice = this.invoiceService.idToInvoice(contract.invoice);
              metricInfo.count += 1;
              metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesAsMember(
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return this.invoiceService.getInvoices().pipe(
      filter((invoices) => invoices.length > 0),
      map((invoices) => {
        return invoices
          .filter((invoices) => invoices.status != INVOICE_STATOOS.INVALIDADO)
          .reduce(
            (metricInfo: MetricInfo, invoice) => {
              const created = invoice.created;
              if (
                this.invoiceService.isInvoiceMember(invoice, uId) &&
                this.utils.isValidDate(created, last, number, fromToday)
              ) {
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
              }
              return metricInfo;
            },
            { count: 0, value: 0 }
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  receivedValueByCoordinations(start: Date, end: Date, uId?: string): Observable<UserAndCoordinations> {
    return this.contractService.getContracts().pipe(
      filter((contracts) => contracts.length > 0),
      map((contracts) => {
        return contracts.reduce((received: UserAndCoordinations, contract) => {
          if (this.contractService.hasPayments(contract._id)) {
            const value = contract.payments.reduce((paid: UserAndCoordinations, payment) => {
              if (payment.paid) {
                const paidDate = payment.paidDate;
                if (paidDate && this.utils.isWithinInterval(paidDate, start, end)) {
                  const uCPayments = payment.team.reduce((upaid: UserAndCoordinations, member) => {
                    const coords = this.departmentService.buildAllCoordinationsList();
                    switch (member.coordination) {
                      case coords[0]:
                        upaid.global.CADM += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CADM += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[1]:
                        upaid.global.CDI += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CDI += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[2]:
                        upaid.global.CGO += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CGO += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[3]:
                        upaid.global.CIMP += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CIMP += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[4]:
                        upaid.global.CINST += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CINST += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[5]:
                        upaid.global.CMA += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CMA += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[6]:
                        upaid.global.CPA += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CPA += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[7]:
                        upaid.global.CRH += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CRH += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[8]:
                        upaid.global.CRH += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CRH += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[9]:
                        upaid.global.CSEST += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CSEST += this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[10]:
                        upaid.global.CSH += this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          upaid.user.CSH += this.stringUtil.moneyToNumber(member.value);
                        break;
                      default:
                        break;
                    }

                    return upaid;
                  }, cloneDeep(this.defaultUserCoordValue));
                  paid.user = mergeWith({}, paid.user, uCPayments.user, add);
                  paid.global = mergeWith({}, paid.global, uCPayments.global, add);
                }
              }
              return paid;
            }, cloneDeep(this.defaultUserCoordValue));
            received.user = mergeWith({}, received.user, value.user, add);
            received.global = mergeWith({}, received.global, value.global, add);
          }
          if (this.contractService.hasExpenses(contract._id)) {
            for (const expense of contract.expenses) {
              if (expense.paid && expense.source) {
                const paidDate = expense.paidDate;
                const source = this.userService.idToUser(expense.source);
                if (
                  paidDate &&
                  this.utils.isWithinInterval(paidDate, start, end) &&
                  source._id != CONTRACT_BALANCE._id &&
                  source._id != CLIENT._id &&
                  source._id != '5eeae34b9e99900017c03ea5'
                ) {
                  const coords = this.departmentService.buildAllCoordinationsList();
                  for (const member of expense.team) {
                    switch (member.coordination) {
                      case coords[0]:
                        received.global.CADM -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CADM -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[1]:
                        received.global.CDI -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CDI -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[2]:
                        received.global.CGO -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CGO -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[3]:
                        received.global.CIMP -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CIMP -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[4]:
                        received.global.CINST -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CINST -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[5]:
                        received.global.CMA -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CMA -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[6]:
                        received.global.CPA -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CPA -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[7]:
                        received.global.CRH -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CRH -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[8]:
                        received.global.CRH -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CRH -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[9]:
                        received.global.CSEST -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CSEST -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      case coords[10]:
                        received.global.CSH -= this.stringUtil.moneyToNumber(member.value);
                        if (this.userService.isEqual(member.user, uId))
                          received.user.CSH -= this.stringUtil.moneyToNumber(member.value);
                        break;
                      default:
                        break;
                    }
                  }
                }
              }
            }
          }
          return received;
        }, cloneDeep(this.defaultUserCoordValue));
      }),
      takeUntil(this.destroy$)
    );
  }

  receivedValueByCoordinationsFiltered(start: Date, end: Date, uId?: string): Observable<FilteredUserAndCoordinations> {
    return this.receivedValueByCoordinations(start, end, uId).pipe(
      map((userCoord: UserAndCoordinations) => {
        if (userCoord == undefined) return userCoord;
        const filtered: FilteredUserAndCoordinations = { user: {}, global: {} };
        for (const coord of this.departmentService.userCoordinations(uId)) {
          const coords = this.departmentService.buildAllCoordinationsList();
          switch (coord) {
            case coords[0]:
              filtered.user.CADM = userCoord.user.CADM;
              filtered.global.CADM = userCoord.global.CADM;
              break;
            case coords[1]:
              filtered.user.CDI = userCoord.user.CDI;
              filtered.global.CDI = userCoord.global.CDI;
              break;
            case coords[2]:
              filtered.user.CGO = userCoord.user.CGO;
              filtered.global.CGO = userCoord.global.CGO;
              break;
            case coords[3]:
              filtered.user.CIMP = userCoord.user.CIMP;
              filtered.global.CIMP = userCoord.global.CIMP;
              break;
            case coords[4]:
              filtered.user.CINST = userCoord.user.CINST;
              filtered.global.CINST = userCoord.global.CINST;
              break;
            case coords[5]:
              filtered.user.CMA = userCoord.user.CMA;
              filtered.global.CMA = userCoord.global.CMA;
              break;
            case coords[6]:
              filtered.user.CPA = userCoord.user.CPA;
              filtered.global.CPA = userCoord.global.CPA;
              break;
            case coords[7]:
              filtered.user.CRH = userCoord.user.CRH;
              filtered.global.CRH = userCoord.global.CRH;
              break;
            case coords[8]:
              filtered.user.CSE = userCoord.user.CSE;
              filtered.global.CSE = userCoord.global.CSE;
              break;
            case coords[9]:
              filtered.user.CSEST = userCoord.user.CSEST;
              filtered.global.CSEST = userCoord.global.CSEST;
              break;
            case coords[10]:
              filtered.user.CSH = userCoord.user.CSH;
              filtered.global.CSH = userCoord.global.CSH;
              break;
            default:
              break;
          }
        }
        return filtered;
      })
    );
  }

  receivedValueByDepartments(start: Date, end: Date, uId?: string): Observable<UserAndDepartments> {
    return this.receivedValueByCoordinations(start, end, uId).pipe(
      map((userCoord: UserAndCoordinations) => {
        const userDepartment = cloneDeep(this.defaultUserDepartmentValue);
        userDepartment.user.DAD += userCoord.user.CADM;
        userDepartment.global.DAD += userCoord.global.CADM;

        userDepartment.user.DAQ += userCoord.user.CDI;
        userDepartment.global.DAQ += userCoord.global.CDI;

        userDepartment.user.DEC += userCoord.user.CGO;
        userDepartment.global.DEC += userCoord.global.CGO;

        userDepartment.user.DEC += userCoord.user.CIMP;
        userDepartment.global.DEC += userCoord.global.CIMP;

        userDepartment.user.DEC += userCoord.user.CINST;
        userDepartment.global.DEC += userCoord.global.CINST;

        userDepartment.user.DRM += userCoord.user.CMA;
        userDepartment.global.DRM += userCoord.global.CMA;

        userDepartment.user.DAQ += userCoord.user.CPA;
        userDepartment.global.DAQ += userCoord.global.CPA;

        userDepartment.user.DRM += userCoord.user.CRH;
        userDepartment.global.DRM += userCoord.global.CRH;

        userDepartment.user.DPC += userCoord.user.CSE;
        userDepartment.global.DPC += userCoord.global.CSE;

        userDepartment.user.DPC += userCoord.user.CSEST;
        userDepartment.global.DPC += userCoord.global.CSEST;

        userDepartment.user.DPC += userCoord.user.CSH;
        userDepartment.global.DPC += userCoord.global.CSH;

        return userDepartment;
      })
    );
  }

  receivedValueByDepartmentsFiltered(start: Date, end: Date, uId?: string): Observable<FilteredUserAndDepartments> {
    return this.receivedValueByDepartments(start, end, uId).pipe(
      map((userDepartment: UserAndDepartments) => {
        const filtered: FilteredUserAndDepartments = { user: {}, global: {} };
        for (const coord of this.departmentService.userCoordinations(uId)) {
          const coords = this.departmentService.buildAllCoordinationsList();
          switch (coord) {
            case coords[0]:
              filtered.user.DAD = this.utils.assingOrIncrement(filtered.user.DAD, userDepartment.user.DAD);
              filtered.global.DAD = this.utils.assingOrIncrement(filtered.global.DAD, userDepartment.global.DAD);
              break;
            case coords[1]:
              filtered.user.DAQ = this.utils.assingOrIncrement(filtered.user.DAQ, userDepartment.user.DAQ);
              filtered.global.DAQ = this.utils.assingOrIncrement(filtered.global.DAQ, userDepartment.global.DAQ);
              break;
            case coords[2]:
              filtered.user.DEC = this.utils.assingOrIncrement(filtered.user.DEC, userDepartment.user.DEC);
              filtered.global.DEC = this.utils.assingOrIncrement(filtered.global.DEC, userDepartment.global.DEC);
              break;
            case coords[3]:
              filtered.user.DEC = this.utils.assingOrIncrement(filtered.user.DEC, userDepartment.user.DEC);
              filtered.global.DEC = this.utils.assingOrIncrement(filtered.global.DEC, userDepartment.global.DEC);
              break;
            case coords[4]:
              filtered.user.DEC = this.utils.assingOrIncrement(filtered.user.DEC, userDepartment.user.DEC);
              filtered.global.DEC = this.utils.assingOrIncrement(filtered.global.DEC, userDepartment.global.DEC);
              break;
            case coords[5]:
              filtered.user.DRM = this.utils.assingOrIncrement(filtered.user.DRM, userDepartment.user.DRM);
              filtered.global.DRM = this.utils.assingOrIncrement(filtered.global.DRM, userDepartment.global.DRM);
              break;
            case coords[6]:
              filtered.user.DAQ = this.utils.assingOrIncrement(filtered.user.DAQ, userDepartment.user.DAQ);
              filtered.global.DAQ = this.utils.assingOrIncrement(filtered.global.DAQ, userDepartment.global.DAQ);
              break;
            case coords[7]:
              filtered.user.DRM = this.utils.assingOrIncrement(filtered.user.DRM, userDepartment.user.DRM);
              filtered.global.DRM = this.utils.assingOrIncrement(filtered.global.DRM, userDepartment.global.DRM);
              break;
            case coords[8]:
              filtered.user.DPC = this.utils.assingOrIncrement(filtered.user.DPC, userDepartment.user.DPC);
              filtered.global.DPC = this.utils.assingOrIncrement(filtered.global.DPC, userDepartment.global.DPC);
              break;
            case coords[9]:
              filtered.user.DPC = this.utils.assingOrIncrement(filtered.user.DPC, userDepartment.user.DPC);
              filtered.global.DPC = this.utils.assingOrIncrement(filtered.global.DPC, userDepartment.global.DPC);
              break;
            case coords[10]:
              filtered.user.DPC = this.utils.assingOrIncrement(filtered.user.DPC, userDepartment.user.DPC);
              filtered.global.DPC = this.utils.assingOrIncrement(filtered.global.DPC, userDepartment.global.DPC);
              break;
            default:
              break;
          }
        }
        return filtered;
      })
    );
  }

  receivedValueNortan(start: Date, end: Date, uId?: string): Observable<UserAndGlobalMetric> {
    return this.receivedValueByDepartments(start, end, uId).pipe(
      map((userDepartment: UserAndDepartments) => {
        const result: UserAndGlobalMetric = { user: 0, global: 0 };
        result.user = Object.values(userDepartment.user).reduce((acc, value) => acc + value);
        result.global = Object.values(userDepartment.global).reduce((acc, value) => acc + value);
        return result;
      })
    );
  }

  receivedValueList(last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje', number = 1, fromToday = false): Observable<any> {
    return combineLatest([this.contractService.getContracts(), this.userService.getUsers()]).pipe(
      map(([contracts, users]) => {
        if (contracts.length > 0 && users.length > 0) {
          const partial = contracts.reduce((received: any, contract) => {
            if (this.contractService.hasPayments(contract._id)) {
              const value = contract.payments.reduce((paid: any, payment) => {
                if (payment.paid) {
                  const paidDate = payment.paidDate;
                  if (paidDate && this.utils.isValidDate(paidDate, last, number, fromToday)) {
                    const uCPayments = payment.team.reduce((upaid: any, member) => {
                      if (member.user) {
                        const author = this.userService.idToName(member.user);
                        const value = this.stringUtil.moneyToNumber(member.value);
                        upaid[author] = upaid[author] ? upaid[author] + value : value;
                      }
                      return upaid;
                    }, {});
                    paid = mergeWith({}, paid, uCPayments, add);
                  }
                }
                return paid;
              }, {});
              received = mergeWith({}, received, value, add);
            }
            return received;
          }, {});
          const complete = users.reduce((userList: any, user) => {
            userList[user.fullName] = 0;
            return userList;
          }, {});
          return mergeWith({}, partial, complete, add);
        }
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContracts(
    role: 'manager' | 'member',
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<number> {
    /* eslint-disable @typescript-eslint/indent */
    const combined$ =
      role == 'manager'
        ? combineLatest([
            this.contractsAsManger(uId, last, number, fromToday),
            this.invoicesAsManger(uId, last, number, fromToday),
          ])
        : combineLatest([
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember(uId, last, number, fromToday),
          ]);
    /* eslint-enable @typescript-eslint/indent */
    return combined$.pipe(
      filter(([contracts, invoices]) => contracts != undefined && invoices != undefined),
      map(([contracts, invoices]) => {
        return this.stringUtil.moneyToNumber(
          this.stringUtil.toPercentageNumber(contracts.count, invoices.count).slice(0, -1)
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContractsValue(
    role: 'manager' | 'member',
    uId: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<number> {
    /* eslint-disable @typescript-eslint/indent */
    const combined$ =
      role == 'manager'
        ? combineLatest([
            this.contractsAsManger(uId, last, number, fromToday),
            this.invoicesAsManger(uId, last, number, fromToday),
          ])
        : combineLatest([
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember(uId, last, number, fromToday),
          ]);
    /* eslint-enable @typescript-eslint/indent */
    return combined$.pipe(
      filter(([contracts, invoices]) => contracts != undefined && invoices != undefined),
      map(([contracts, invoices]) => {
        return this.stringUtil.moneyToNumber(
          this.stringUtil.toPercentageNumber(contracts.value, invoices.value).slice(0, -1)
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  impulses(
    uId?: string,
    last: 'Hoje' | 'Dia' | 'Mês' | 'Ano' = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<number> {
    return this.contractService.getContracts().pipe(
      map((contracts) => {
        if (contracts.length > 0) {
          return contracts.reduce((sum, contract) => {
            if (this.contractService.hasReceipts(contract._id)) {
              sum += contract.receipts
                .filter((r) => r.paid)
                .reduce((acc, receipt) => {
                  const paidDate = receipt.paidDate;
                  if (paidDate && this.utils.isValidDate(paidDate, last, number, fromToday))
                    acc += this.stringUtil.moneyToNumber(
                      this.contractService.toNetValue(
                        receipt.value,
                        this.utils.nfPercentage(contract),
                        this.utils.nortanPercentage(contract)
                      )
                    );
                  return acc;
                }, 0.0);
            }
            return sum;
          }, 0.0);
        }
        return 0.0;
      }),
      map((sumNetValue) => Math.trunc(sumNetValue / 1000))
    );
  }

  contracts(uId: string, start: Date, end: Date): Observable<MetricInfo> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            const created = contract.created;
            if (
              contract.invoice &&
              this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
              this.utils.isWithinInterval(created, start, end)
            ) {
              const invoice = this.invoiceService.idToInvoice(contract.invoice);
              metricInfo.count += 1;
              metricInfo.value += this.stringUtil.moneyToNumber(invoice.value);
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      take(1)
    );
  }

  receivedValue(uId: string, start: Date, end: Date): Observable<MetricInfo> {
    return this.contractService.getContracts().pipe(
      filter((contracts) => contracts.length > 0),
      map((contracts) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            if (this.contractService.hasPayments(contract._id)) {
              const value = contract.payments.reduce(
                (paid: MetricInfo, payment) => {
                  if (payment.paid && payment.paidDate) {
                    const paidDate = payment.paidDate;
                    if (this.utils.isWithinInterval(paidDate, start, end)) {
                      const uPayments = payment.team.reduce(
                        (upaid: MetricInfo, member) => {
                          if (this.userService.isEqual(member.user, uId)) {
                            upaid.count += 1;
                            upaid.value += this.stringUtil.moneyToNumber(member.value);
                          }
                          return upaid;
                        },
                        { count: 0, value: 0 }
                      );
                      paid.count += uPayments.count;
                      paid.value += uPayments.value;
                    }
                  }
                  return paid;
                },
                { count: 0, value: 0 }
              );
              metricInfo.count += value.count;
              metricInfo.value += value.value;
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      take(1)
    );
  }

  nortanValue(
    start: Date,
    end: Date,
    type: 'nortan' | 'taxes' = 'nortan',
    uId?: string
  ): Observable<UserAndGlobalMetric> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: UserAndGlobalMetric, contract) => {
            if (this.contractService.hasReceipts(contract._id)) {
              const value = contract.receipts
                .filter((receipt) => receipt.paid)
                .reduce(
                  (paid: UserAndGlobalMetric, receipt) => {
                    const paidDate = receipt.paidDate;
                    if (paidDate && this.utils.isWithinInterval(paidDate, start, end)) {
                      const value = this.stringUtil.moneyToNumber(
                        this.stringUtil.applyPercentage(
                          receipt.value,
                          type == 'nortan' ? receipt.nortanPercentage : receipt.notaFiscal
                        )
                      );
                      if (uId && contract.invoice && this.invoiceService.isInvoiceAuthor(contract.invoice, uId))
                        paid.user += value;
                      paid.global += value;
                    }
                    return paid;
                  },
                  { user: 0, global: 0 }
                );
              metricInfo.user += value.user;
              metricInfo.global += value.global;
            }
            return metricInfo;
          },
          { user: 0, global: 0 }
        );
      }),
      take(1)
    );
  }

  teamExpenses(start: Date, end: Date): Observable<MetricInfo> {
    return this.nortanService.getExpenses().pipe(
      map((expenses) => {
        return expenses
          .filter((expense) => expense.paid)
          .reduce(
            (acc, expense) => {
              const paidDate = expense.paidDate;
              if (paidDate && this.utils.isWithinInterval(paidDate, start, end)) {
                acc.count += 1;
                acc.value += this.stringUtil.moneyToNumber(expense.value);
              }
              return acc;
            },
            { count: 0, value: 0 }
          );
      })
    );
  }

  cashbackValue(uId: string, percentage: string, start: Date, end: Date): Observable<MetricInfo> {
    return this.nortanValue(start, end, 'nortan', uId).pipe(
      map((metricInfo): MetricInfo => {
        metricInfo.user *= this.stringUtil.toMultiplyPercentage(percentage);
        return { count: 0, value: metricInfo.user };
      })
    );
  }

  countContracts(status: CONTRACT_STATOOS): Observable<MetricInfo> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            if (contract.status == status) {
              metricInfo.count += 1;
              if (contract.invoice)
                metricInfo.value += this.stringUtil.moneyToNumber(
                  this.invoiceService.idToInvoice(contract.invoice).value
                );
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      take(1)
    );
  }

  receivedValueTimeSeries(uId?: string): Observable<TimeSeriesItem[]> {
    return this.contractService.getContracts().pipe(
      map((contracts) => {
        const fContracts = contracts.filter((contract) => this.contractService.hasPayments(contract));
        const timeSeriesItems = fContracts.map((contract) => {
          let fPayments = contract.payments.filter((payment) => payment.paid);
          if (uId != undefined) {
            fPayments = fPayments.filter((payment) => {
              return payment.team
                .map((team) => this.userService.isEqual(team.user, uId))
                .filter((isSameUser) => isSameUser).length;
            });
            fPayments = fPayments.map((payment) => {
              const tmp = cloneDeep(payment);
              tmp.value = payment.team[0].value;
              return tmp;
            });
          }
          return fPayments.map((payment) => {
            const date: string = payment.paidDate ? format(payment.paidDate, 'yyyy/MM/dd') : '';
            return [date, this.stringUtil.moneyToNumber(payment.value)] as TimeSeriesItem;
          });
        });
        const timeSeriesItemsFlat = timeSeriesItems.flat();
        return this.utils.groupByDateTimeSerie(timeSeriesItemsFlat);
      })
    );
  }

  expensesTimeSeries(uId?: string): Observable<TimeSeriesItem[]> {
    return this.contractService.getContracts().pipe(
      map((contracts) => {
        const fContracts = cloneDeep(contracts.filter((contract) => this.contractService.hasExpenses(contract)));
        const timeSeriesItems = fContracts.map((contract) => {
          let fExpenses = contract.expenses.filter(
            (expense) =>
              expense.paid &&
              !this.userService.isEqual(expense.source, CONTRACT_BALANCE) &&
              !this.userService.isEqual(expense.source, CLIENT)
          );
          if (uId != undefined) {
            fExpenses = fExpenses.filter((expense) => {
              return expense.team
                .map((team) => this.userService.isEqual(team.user, uId))
                .filter((isSameUser) => isSameUser).length;
            });
            fExpenses = fExpenses.map((expense) => {
              expense.value = expense.team[0].value;
              return expense;
            });
          }
          return fExpenses.map((expense) => {
            const date: string = expense.paidDate ? format(expense.paidDate, 'yyyy/MM/dd') : '';
            return [date, -1 * this.stringUtil.moneyToNumber(expense.value)] as TimeSeriesItem;
          });
        });
        const timeSeriesItemsFlat = timeSeriesItems.flat();
        return this.utils.groupByDateTimeSerie(timeSeriesItemsFlat);
      })
    );
  }

  contractValueTimeSeries(uId?: string): Observable<TimeSeriesItem[]> {
    return combineLatest([this.contractService.getContracts(), this.invoiceService.getInvoices()]).pipe(
      filter(([contracts, invoices]) => contracts.length > 0 && invoices.length > 0),
      map(([contracts, invoices]) => {
        let fContracts = contracts.map((iContract) => {
          const contract = cloneDeep(iContract);
          if (contract.invoice) contract.value = this.invoiceService.idToInvoice(contract.invoice).value;
          return contract;
        });
        if (uId != undefined) {
          fContracts = fContracts.filter((contract) => {
            if (contract.invoice === undefined) return false;
            return this.invoiceService
              .idToInvoice(contract.invoice)
              .team.map((team) => this.userService.isEqual(team.user, uId) && team.distribution != undefined)
              .filter((isSameUser) => isSameUser).length;
          });
          fContracts = fContracts.map((contract) => {
            if (contract.invoice !== undefined) {
              contract.value = this.stringUtil.applyPercentage(
                contract.value,
                this.invoiceService.idToInvoice(contract.invoice).team[0].distribution
              );
            }
            return contract;
          });
        }
        const timeSeriesItems = fContracts.map((contract) => {
          const date: string = contract.created ? format(contract.created, 'yyyy/MM/dd') : '';
          return [date, this.stringUtil.moneyToNumber(contract.value)] as TimeSeriesItem;
        });
        return this.utils.groupByDateTimeSerie(timeSeriesItems);
      })
    );
  }
}
