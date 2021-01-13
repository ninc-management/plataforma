import { Injectable, OnDestroy } from '@angular/core';
import { ContractService } from './contract.service';
import { ContractorService } from './contractor.service';
import { InvoiceService } from './invoice.service';
import { UserService } from './user.service';
import { DepartmentService } from './department.service';
import { StringUtilService } from './string-util.service';
import { UtilsService } from './utils.service';
import { parseISO } from 'date-fns';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

interface MetricInfo {
  count: number;
  value: number;
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
interface Departaments {
  DAD: number;
  DEC: number;
  DAQ: number;
  DPC: number;
  DRM: number;
}

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  destroy$ = new Subject<void>();

  defaultCoordsValue: Coordinations = {
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
  defaultUserCoordValue: UserAndCoordinations = {
    user: Object.assign({}, this.defaultCoordsValue),
    global: Object.assign({}, this.defaultCoordsValue),
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

  userCoordRepresentation(
    coord: string,
    userCoord: UserAndCoordinations
  ): string {
    const coords = this.departmentService.buildAllCoordinationsList();
    switch (coord) {
      case coords[0]:
        return this.stringUtil.toPercentage(
          userCoord.user.CADM.toString(),
          userCoord.global.CADM.toString()
        );
      case coords[1]:
        return this.stringUtil.toPercentage(
          userCoord.user.CDI.toString(),
          userCoord.global.CDI.toString()
        );
      case coords[2]:
        return this.stringUtil.toPercentage(
          userCoord.user.CGO.toString(),
          userCoord.global.CGO.toString()
        );
      case coords[3]:
        return this.stringUtil.toPercentage(
          userCoord.user.CIMP.toString(),
          userCoord.global.CIMP.toString()
        );
      case coords[4]:
        return this.stringUtil.toPercentage(
          userCoord.user.CINST.toString(),
          userCoord.global.CINST.toString()
        );
      case coords[5]:
        return this.stringUtil.toPercentage(
          userCoord.user.CMA.toString(),
          userCoord.global.CMA.toString()
        );
      case coords[6]:
        return this.stringUtil.toPercentage(
          userCoord.user.CPA.toString(),
          userCoord.global.CPA.toString()
        );
      case coords[7]:
        return this.stringUtil.toPercentage(
          userCoord.user.CRH.toString(),
          userCoord.global.CRH.toString()
        );
      case coords[8]:
        return this.stringUtil.toPercentage(
          userCoord.user.CSE.toString(),
          userCoord.global.CSE.toString()
        );
      case coords[9]:
        return this.stringUtil.toPercentage(
          userCoord.user.CSEST.toString(),
          userCoord.global.CSEST.toString()
        );
      case coords[10]:
        return this.stringUtil.toPercentage(
          userCoord.user.CSH.toString(),
          userCoord.global.CSH.toString()
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
    return combineLatest(
      this.contractService.getContracts(),
      this.invoiceService.getInvoices()
    ).pipe(
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
                const invoice =
                  contract.invoice?._id == undefined
                    ? this.invoiceService.idToInvoice(contract.invoice)
                    : contract.invoice;
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
          return invoices.reduce(
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
    return combineLatest(
      this.contractService.getContracts(),
      this.invoiceService.getInvoices()
    ).pipe(
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
                const invoice =
                  contract.invoice?._id == undefined
                    ? this.invoiceService.idToInvoice(contract.invoice)
                    : contract.invoice;
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
          return invoices.reduce(
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

  receivedValue(
    uId: string,
    last = 'Hoje',
    number = 1,
    fromToday = false
  ): Observable<number> {
    return this.contractService.getContracts().pipe(
      map((contracts) => {
        if (contracts.length > 0)
          return contracts.reduce((received, contract) => {
            if (this.contractService.hasPayments(contract._id)) {
              const value = contract.payments.reduce((paid, payment) => {
                if (payment.paid != 'não') {
                  let paidDate = payment.paidDate;
                  if (typeof paidDate !== 'object')
                    paidDate = parseISO(paidDate);
                  if (
                    this.utils.compareDates(paidDate, last, number, fromToday)
                  )
                    return (
                      paid +
                      payment.team.reduce((upaid, member) => {
                        const author =
                          member.user._id == undefined
                            ? member.user
                            : member.user._id;
                        if (author == uId)
                          return (
                            upaid + this.stringUtil.moneyToNumber(member.value)
                          );
                        return upaid;
                      }, 0)
                    );
                }
                return paid;
              }, 0);
              return received + value;
            }
            return received;
          }, 0);
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
                    if (payment.paid != 'não') {
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
                            const coords = this.departmentService.buildAllCoordinationsList();
                            const author =
                              member.user._id == undefined
                                ? member.user
                                : member.user._id;
                            switch (member.coordination) {
                              case coords[0]:
                                upaid.global.CADM += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CADM += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[1]:
                                upaid.global.CDI += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CDI += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[2]:
                                upaid.global.CGO += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CGO += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[3]:
                                upaid.global.CIMP += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CIMP += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[4]:
                                upaid.global.CINST += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CINST += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[5]:
                                upaid.global.CMA += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CMA += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[6]:
                                upaid.global.CPA += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CPA += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[7]:
                                upaid.global.CRH += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CRH += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[8]:
                                upaid.global.CRH += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CRH += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[9]:
                                upaid.global.CSEST += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CSEST += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              case coords[10]:
                                upaid.global.CSH += this.stringUtil.moneyToNumber(
                                  member.value
                                );
                                if (author == uId)
                                  upaid.user.CSH += this.stringUtil.moneyToNumber(
                                    member.value
                                  );
                                break;
                              default:
                                break;
                            }
                            return upaid;
                          },
                          this.utils.deepCopy(this.defaultUserCoordValue)
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
                  this.utils.deepCopy(this.defaultUserCoordValue)
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
              return received;
            },
            this.utils.deepCopy(this.defaultUserCoordValue)
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
        let filtered: UserAndCoordinations = { user: {}, global: {} };
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
        return filtered as UserAndCoordinations;
      })
    );
  }

  invoicesToContracts(
    role: 'manager' | 'member',
    uId: string,
    last = 'Mês',
    number = 1,
    fromToday = false
  ): Observable<number> {
    /* eslint-disable @typescript-eslint/indent */
    const combined$ =
      role == 'manager'
        ? combineLatest(
            this.contractsAsManger(uId, last, number, fromToday),
            this.invoicesAsManger(uId, last, number, fromToday)
          )
        : combineLatest(
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember(uId, last, number, fromToday)
          );
    /* eslint-enable @typescript-eslint/indent */
    return combined$.pipe(
      map(([contracts, invoices]) => {
        if (contracts != undefined && invoices != undefined)
          return this.stringUtil.moneyToNumber(
            this.stringUtil
              .toPercentage(
                contracts.count.toString(),
                invoices.count.toString()
              )
              .slice(0, -1)
          );
      }),
      takeUntil(this.destroy$)
    );
  }

  invoicesToContractsValue(
    role: 'manager' | 'member',
    uId: string,
    last = 'Mês',
    number = 1,
    fromToday = false
  ): Observable<number> {
    /* eslint-disable @typescript-eslint/indent */
    const combined$ =
      role == 'manager'
        ? combineLatest(
            this.contractsAsManger(uId, last, number, fromToday),
            this.invoicesAsManger(uId, last, number, fromToday)
          )
        : combineLatest(
            this.contractsAsMember(uId, last, number, fromToday),
            this.invoicesAsMember(uId, last, number, fromToday)
          );
    /* eslint-enable @typescript-eslint/indent */
    return combined$.pipe(
      map(([contracts, invoices]) => {
        if (contracts != undefined && invoices != undefined)
          return this.stringUtil.moneyToNumber(
            this.stringUtil
              .toPercentage(
                contracts.value.toString(),
                invoices.value.toString()
              )
              .slice(0, -1)
          );
      }),
      takeUntil(this.destroy$)
    );
  }
}
