import { Injectable, OnDestroy } from '@angular/core';
import { parseISO } from 'date-fns';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map, take, filter } from 'rxjs/operators';
import { ContractService } from './contract.service';
import { ContractorService } from './contractor.service';
import { InvoiceService, INVOICE_STATOOS } from './invoice.service';
import { UserService, CONTRACT_BALANCE } from './user.service';
import { DepartmentService } from './department.service';
import { StringUtilService } from './string-util.service';
import { UtilsService } from './utils.service';
import * as _ from 'lodash';

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

// Department-coordination.json file order
interface Departments {
  DAD?: number;
  DEC?: number;
  DAQ?: number;
  DPC?: number;
  DRM?: number;
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

  userDepartmentRepresentation(
    department: string,
    userDepartment: UserAndDepartments
  ): string {
    const departmentsAbrevs = this.departmentService
      .buildDepartmentList()
      .map((d) => d.slice(0, 3)); // DAD DEC DAQ DPC DRM
    switch (department) {
      case departmentsAbrevs[0]:
        return this.stringUtil.toPercentageNumber(
          userDepartment.user.DAD,
          userDepartment.global.DAD
        );
      case departmentsAbrevs[1]:
        return this.stringUtil.toPercentageNumber(
          userDepartment.user.DEC,
          userDepartment.global.DEC
        );
      case departmentsAbrevs[2]:
        return this.stringUtil.toPercentageNumber(
          userDepartment.user.DAQ,
          userDepartment.global.DAQ
        );
      case departmentsAbrevs[3]:
        return this.stringUtil.toPercentageNumber(
          userDepartment.user.DPC,
          userDepartment.global.DPC
        );
      case departmentsAbrevs[4]:
        return this.stringUtil.toPercentageNumber(
          userDepartment.user.DRM,
          userDepartment.global.DRM
        );
      default:
        return '';
    }
  }

  userCoordRepresentation(
    coord: string,
    userCoord: UserAndCoordinations
  ): string {
    const coords = this.departmentService.buildAllCoordinationsList();
    switch (coord) {
      case coords[0]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CADM,
          userCoord.global.CADM
        );
      case coords[1]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CDI,
          userCoord.global.CDI
        );
      case coords[2]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CGO,
          userCoord.global.CGO
        );
      case coords[3]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CIMP,
          userCoord.global.CIMP
        );
      case coords[4]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CINST,
          userCoord.global.CINST
        );
      case coords[5]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CMA,
          userCoord.global.CMA
        );
      case coords[6]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CPA,
          userCoord.global.CPA
        );
      case coords[7]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CRH,
          userCoord.global.CRH
        );
      case coords[8]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CSE,
          userCoord.global.CSE
        );
      case coords[9]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CSEST,
          userCoord.global.CSEST
        );
      case coords[10]:
        return this.stringUtil.toPercentageNumber(
          userCoord.user.CSH,
          userCoord.global.CSH
        );
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
        return number > 1
          ? 'Nos últimos ' + number + ' meses'
          : 'No mês passado';
      }
      case 'Ano': {
        return number > 1
          ? 'Nos últimos ' + number + ' anos'
          : 'No ano passado';
      }
      default: {
        return '';
      }
    }
  }

  contractsAsManger(
    uId: string,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
    ]).pipe(
      map(([contracts, invoices]) => {
        if (contracts.length > 0 && invoices.length > 0)
          return contracts.reduce(
            (metricInfo: MetricInfo, contract) => {
              let created = contract.created;
              if (typeof created !== 'object') created = parseISO(created);
              if (
                this.invoiceService.isInvoiceAuthor(contract.invoice, uId) &&
                this.utils.compareDates(created, last, number, fromToday)
              ) {
                const invoice = this.invoiceService.idToInvoice(
                  contract.invoice
                );
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(
                  invoice.value
                );
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
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return this.invoiceService.getInvoices().pipe(
      map((invoices) => {
        if (invoices.length > 0)
          return invoices
            .filter((invoices) => invoices.status != INVOICE_STATOOS.INVALIDADO)
            .reduce(
              (metricInfo: MetricInfo, invoice) => {
                let created = invoice.created;
                if (typeof created !== 'object') created = parseISO(created);
                if (
                  this.invoiceService.isInvoiceAuthor(invoice, uId) &&
                  this.utils.compareDates(created, last, number, fromToday)
                ) {
                  metricInfo.count += 1;
                  metricInfo.value += this.stringUtil.moneyToNumber(
                    invoice.value
                  );
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
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
    ]).pipe(
      map(([contracts, invoices]) => {
        if (contracts.length > 0 && invoices.length > 0)
          return contracts.reduce(
            (metricInfo: MetricInfo, contract) => {
              let created = contract.created;
              if (typeof created !== 'object') created = parseISO(created);
              if (
                this.invoiceService.isInvoiceMember(contract.invoice, uId) &&
                this.utils.compareDates(created, last, number, fromToday)
              ) {
                const invoice = this.invoiceService.idToInvoice(
                  contract.invoice
                );
                metricInfo.count += 1;
                metricInfo.value += this.stringUtil.moneyToNumber(
                  invoice.value
                );
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
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<MetricInfo> {
    return this.invoiceService.getInvoices().pipe(
      map((invoices) => {
        if (invoices.length > 0)
          return invoices
            .filter((invoices) => invoices.status != INVOICE_STATOOS.INVALIDADO)
            .reduce(
              (metricInfo: MetricInfo, invoice) => {
                let created = invoice.created;
                if (typeof created !== 'object') created = parseISO(created);
                if (
                  this.invoiceService.isInvoiceMember(invoice, uId) &&
                  this.utils.compareDates(created, last, number, fromToday)
                ) {
                  metricInfo.count += 1;
                  metricInfo.value += this.stringUtil.moneyToNumber(
                    invoice.value
                  );
                }
                return metricInfo;
              },
              { count: 0, value: 0 }
            );
      }),
      takeUntil(this.destroy$)
    );
  }

  receivedValueByCoordinations(
    uId: string = undefined,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<UserAndCoordinations> {
    return this.contractService.getContracts().pipe(
      map((contracts) => {
        if (contracts.length > 0)
          return contracts.reduce(
            (received: UserAndCoordinations, contract) => {
              if (this.contractService.hasPayments(contract._id)) {
                const value = contract.payments.reduce(
                  (paid: UserAndCoordinations, payment) => {
                    if (payment.paid) {
                      let paidDate = payment.paidDate;
                      if (typeof paidDate !== 'object')
                        paidDate = parseISO(paidDate);
                      if (
                        this.utils.compareDates(
                          paidDate,
                          last,
                          number,
                          fromToday
                        )
                      ) {
                        const uCPayments = payment.team.reduce(
                          (upaid: UserAndCoordinations, member) => {
                            const coords =
                              this.departmentService.buildAllCoordinationsList();
                            const author = this.userService.idToUser(
                              member.user
                            )._id;
                            switch (member.coordination) {
                              case coords[0]:
                                upaid.global.CADM +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CADM +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[1]:
                                upaid.global.CDI +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CDI +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[2]:
                                upaid.global.CGO +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CGO +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[3]:
                                upaid.global.CIMP +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CIMP +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[4]:
                                upaid.global.CINST +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CINST +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[5]:
                                upaid.global.CMA +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CMA +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[6]:
                                upaid.global.CPA +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CPA +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[7]:
                                upaid.global.CRH +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CRH +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[8]:
                                upaid.global.CRH +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CRH +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[9]:
                                upaid.global.CSEST +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CSEST +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              case coords[10]:
                                upaid.global.CSH +=
                                  this.stringUtil.moneyToNumber(member.value);
                                if (author == uId)
                                  upaid.user.CSH +=
                                    this.stringUtil.moneyToNumber(member.value);
                                break;
                              default:
                                break;
                            }
                            return upaid;
                          },
                          _.cloneDeep(this.defaultUserCoordValue)
                        );
                        paid.user = this.utils.sumObjectsByKey(
                          paid.user,
                          uCPayments.user
                        );
                        paid.global = this.utils.sumObjectsByKey(
                          paid.global,
                          uCPayments.global
                        );
                      }
                    }
                    return paid;
                  },
                  _.cloneDeep(this.defaultUserCoordValue)
                );
                received.user = this.utils.sumObjectsByKey(
                  received.user,
                  value.user
                );
                received.global = this.utils.sumObjectsByKey(
                  received.global,
                  value.global
                );
              }
              if (this.contractService.hasExpenses(contract._id)) {
                for (const expense of contract.expenses) {
                  if (expense.paid) {
                    let paidDate = expense.paidDate;
                    const source = this.userService.idToUser(expense.source);
                    if (typeof paidDate !== 'object')
                      paidDate = parseISO(paidDate);
                    if (
                      this.utils.compareDates(
                        paidDate,
                        last,
                        number,
                        fromToday
                      ) &&
                      source._id != CONTRACT_BALANCE._id
                    ) {
                      const coords =
                        this.departmentService.buildAllCoordinationsList();
                      for (const member of expense.team) {
                        const author = this.userService.idToUser(
                          member.user
                        )._id;
                        switch (member.coordination) {
                          case coords[0]:
                            received.global.CADM -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CADM -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[1]:
                            received.global.CDI -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CDI -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[2]:
                            received.global.CGO -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CGO -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[3]:
                            received.global.CIMP -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CIMP -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[4]:
                            received.global.CINST -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CINST -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[5]:
                            received.global.CMA -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CMA -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[6]:
                            received.global.CPA -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CPA -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[7]:
                            received.global.CRH -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CRH -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[8]:
                            received.global.CRH -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CRH -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[9]:
                            received.global.CSEST -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CSEST -=
                                this.stringUtil.moneyToNumber(member.value);
                            break;
                          case coords[10]:
                            received.global.CSH -=
                              this.stringUtil.moneyToNumber(member.value);
                            if (author == uId)
                              received.user.CSH -=
                                this.stringUtil.moneyToNumber(member.value);
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
            },
            _.cloneDeep(this.defaultUserCoordValue)
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  receivedValueByCoordinationsFiltered(
    uId: string = undefined,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<UserAndCoordinations> {
    return this.receivedValueByCoordinations(uId, last, number, fromToday).pipe(
      map((userCoord: UserAndCoordinations) => {
        if (userCoord == undefined) return userCoord;
        const filtered: UserAndCoordinations = { user: {}, global: {} };
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

  receivedValueByDepartments(
    uId: string = undefined,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<UserAndDepartments> {
    return this.receivedValueByCoordinations(uId, last, number, fromToday).pipe(
      map((userCoord: UserAndCoordinations) => {
        if (userCoord == undefined) return undefined;
        const userDepartment = _.cloneDeep(this.defaultUserDepartmentValue);
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

  receivedValueByDepartmentsFiltered(
    uId: string = undefined,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<UserAndDepartments> {
    return this.receivedValueByDepartments(uId, last, number, fromToday).pipe(
      map((userDepartment: UserAndDepartments) => {
        if (userDepartment == undefined) return undefined;
        const filtered: UserAndDepartments = { user: {}, global: {} };
        for (const coord of this.departmentService.userCoordinations(uId)) {
          const coords = this.departmentService.buildAllCoordinationsList();
          switch (coord) {
            case coords[0]:
              filtered.user.DAD = this.utils.assingOrIncrement(
                filtered.user.DAD,
                userDepartment.user.DAD
              );
              filtered.global.DAD = this.utils.assingOrIncrement(
                filtered.global.DAD,
                userDepartment.global.DAD
              );
              break;
            case coords[1]:
              filtered.user.DAQ = this.utils.assingOrIncrement(
                filtered.user.DAQ,
                userDepartment.user.DAQ
              );
              filtered.global.DAQ = this.utils.assingOrIncrement(
                filtered.global.DAQ,
                userDepartment.global.DAQ
              );
              break;
            case coords[2]:
              filtered.user.DEC = this.utils.assingOrIncrement(
                filtered.user.DEC,
                userDepartment.user.DEC
              );
              filtered.global.DEC = this.utils.assingOrIncrement(
                filtered.global.DEC,
                userDepartment.global.DEC
              );
              break;
            case coords[3]:
              filtered.user.DEC = this.utils.assingOrIncrement(
                filtered.user.DEC,
                userDepartment.user.DEC
              );
              filtered.global.DEC = this.utils.assingOrIncrement(
                filtered.global.DEC,
                userDepartment.global.DEC
              );
              break;
            case coords[4]:
              filtered.user.DEC = this.utils.assingOrIncrement(
                filtered.user.DEC,
                userDepartment.user.DEC
              );
              filtered.global.DEC = this.utils.assingOrIncrement(
                filtered.global.DEC,
                userDepartment.global.DEC
              );
              break;
            case coords[5]:
              filtered.user.DRM = this.utils.assingOrIncrement(
                filtered.user.DRM,
                userDepartment.user.DRM
              );
              filtered.global.DRM = this.utils.assingOrIncrement(
                filtered.global.DRM,
                userDepartment.global.DRM
              );
              break;
            case coords[6]:
              filtered.user.DAQ = this.utils.assingOrIncrement(
                filtered.user.DAQ,
                userDepartment.user.DAQ
              );
              filtered.global.DAQ = this.utils.assingOrIncrement(
                filtered.global.DAQ,
                userDepartment.global.DAQ
              );
              break;
            case coords[7]:
              filtered.user.DRM = this.utils.assingOrIncrement(
                filtered.user.DRM,
                userDepartment.user.DRM
              );
              filtered.global.DRM = this.utils.assingOrIncrement(
                filtered.global.DRM,
                userDepartment.global.DRM
              );
              break;
            case coords[8]:
              filtered.user.DPC = this.utils.assingOrIncrement(
                filtered.user.DPC,
                userDepartment.user.DPC
              );
              filtered.global.DPC = this.utils.assingOrIncrement(
                filtered.global.DPC,
                userDepartment.global.DPC
              );
              break;
            case coords[9]:
              filtered.user.DPC = this.utils.assingOrIncrement(
                filtered.user.DPC,
                userDepartment.user.DPC
              );
              filtered.global.DPC = this.utils.assingOrIncrement(
                filtered.global.DPC,
                userDepartment.global.DPC
              );
              break;
            case coords[10]:
              filtered.user.DPC = this.utils.assingOrIncrement(
                filtered.user.DPC,
                userDepartment.user.DPC
              );
              filtered.global.DPC = this.utils.assingOrIncrement(
                filtered.global.DPC,
                userDepartment.global.DPC
              );
              break;
            default:
              break;
          }
        }
        return filtered;
      })
    );
  }

  receivedValueNortan(
    uId: string = undefined,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<UserAndGlobalMetric> {
    return this.receivedValueByDepartments(uId, last, number, fromToday).pipe(
      map((userDepartment: UserAndDepartments) => {
        if (userDepartment == undefined) return undefined;
        const result: UserAndGlobalMetric = { user: 0, global: 0 };
        result.user = Object.values(userDepartment.user).reduce(
          (acc, value) => acc + value
        );
        result.global = Object.values(userDepartment.global).reduce(
          (acc, value) => acc + value
        );
        return result;
      })
    );
  }

  receivedValueList(
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<any> {
    return combineLatest([
      this.contractService.getContracts(),
      this.userService.getUsers(),
    ]).pipe(
      map(([contracts, users]) => {
        if (contracts.length > 0 && users.length > 0) {
          const partial = contracts.reduce((received: any, contract) => {
            if (this.contractService.hasPayments(contract._id)) {
              const value = contract.payments.reduce((paid: any, payment) => {
                if (payment.paid) {
                  let paidDate = payment.paidDate;
                  if (typeof paidDate !== 'object')
                    paidDate = parseISO(paidDate);
                  if (
                    this.utils.compareDates(paidDate, last, number, fromToday)
                  ) {
                    const uCPayments = payment.team.reduce(
                      (upaid: any, member) => {
                        const author = this.userService.idToName(member.user);
                        const value = this.stringUtil.moneyToNumber(
                          member.value
                        );
                        upaid[author] = upaid[author]
                          ? upaid[author] + value
                          : value;

                        return upaid;
                      },
                      {}
                    );
                    paid = this.utils.sumObjectsByKey(paid, uCPayments);
                  }
                }
                return paid;
              }, {});
              received = this.utils.sumObjectsByKey(received, value);
            }
            return received;
          }, {});
          const complete = users.reduce((userList: any, user) => {
            userList[user.fullName] = 0;
            return userList;
          }, {});
          return this.utils.sumObjectsByKey(partial, complete);
        }
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContracts(
    role: 'manager' | 'member',
    uId: string,
    last = 'Hoje',
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
      map(([contracts, invoices]) => {
        if (contracts != undefined && invoices != undefined)
          return this.stringUtil.moneyToNumber(
            this.stringUtil
              .toPercentageNumber(contracts.count, invoices.count)
              .slice(0, -1)
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContractsValue(
    role: 'manager' | 'member',
    uId: string,
    last = 'Hoje',
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
      map(([contracts, invoices]) => {
        if (contracts != undefined && invoices != undefined)
          return this.stringUtil.moneyToNumber(
            this.stringUtil
              .toPercentageNumber(contracts.value, invoices.value)
              .slice(0, -1)
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  impulses(
    uId: string = undefined,
    last = 'Hoje',
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
                  let paidDate = receipt.paidDate;
                  if (typeof paidDate !== 'object')
                    paidDate = parseISO(paidDate);
                  if (
                    this.utils.compareDates(paidDate, last, number, fromToday)
                  )
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
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
    ]).pipe(
      filter(
        ([contracts, invoices]) => contracts.length > 0 && invoices.length > 0
      ),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            let created = contract.created;
            if (typeof created !== 'object') created = parseISO(created);
            if (
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
                  if (payment.paid) {
                    let paidDate = payment.paidDate;
                    if (typeof paidDate !== 'object')
                      paidDate = parseISO(paidDate);
                    if (this.utils.isWithinInterval(paidDate, start, end)) {
                      const uPayments = payment.team.reduce(
                        (upaid: MetricInfo, member) => {
                          const author = this.userService.idToUser(
                            member.user
                          )._id;
                          if (author == uId) {
                            upaid.count += 1;
                            upaid.value += this.stringUtil.moneyToNumber(
                              member.value
                            );
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
              metricInfo.count = value.count;
              metricInfo.value = value.value;
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      take(1)
    );
  }

  cashbackValue(
    uId: string,
    percentage: string,
    start: Date,
    end: Date
  ): Observable<MetricInfo> {
    return combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
    ]).pipe(
      filter(
        ([contracts, invoices]) => contracts.length > 0 && invoices.length > 0
      ),
      map(([contracts, invoices]) => {
        return contracts.reduce(
          (metricInfo: MetricInfo, contract) => {
            if (this.contractService.hasReceipts(contract._id)) {
              const value = contract.receipts
                .filter(
                  (receipt) =>
                    receipt.paid &&
                    this.invoiceService.isInvoiceAuthor(contract.invoice, uId)
                )
                .reduce(
                  (paid: MetricInfo, receipt) => {
                    let paidDate = receipt.paidDate;
                    if (typeof paidDate !== 'object')
                      paidDate = parseISO(paidDate);
                    if (this.utils.isWithinInterval(paidDate, start, end)) {
                      paid.count += 1;
                      paid.value +=
                        this.stringUtil.moneyToNumber(receipt.value) *
                        (1 -
                          this.stringUtil.toMutiplyPercentage(
                            receipt.nortanPercentage
                          ));
                    }
                    return paid;
                  },
                  { count: 0, value: 0 }
                );
              metricInfo.count = value.count;
              metricInfo.value = value.value;
            }
            return metricInfo;
          },
          { count: 0, value: 0 }
        );
      }),
      map((metricInfo) => {
        metricInfo.value *= 1 - this.stringUtil.toMutiplyPercentage(percentage);
        return metricInfo;
      }),
      take(1)
    );
  }
}
