import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChildren,
} from '@angular/core';
import { startOfMonth, subMonths } from 'date-fns';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { map, skipWhile, take, takeUntil } from 'rxjs/operators';

import { MetricItem } from '../metric-item/metric-item.component';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { FinancialService } from 'app/shared/services/financial.service';
import { INVOICE_STATOOS, InvoiceService } from 'app/shared/services/invoice.service';
import { MetricInfo, MetricsService } from 'app/shared/services/metrics.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { NOT } from 'app/shared/utils';

/* eslint-disable indent */
@Component({
  selector: 'ngx-progress-section',
  templateUrl: './progress-section.component.html',
  styleUrls: ['./progress-section.component.scss'],
})
export class ProgressSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  /* eslint-enable indent */
  @ViewChildren('textMetric', { read: ElementRef })
  metricsRef!: QueryList<ElementRef>;
  METRICS: MetricItem[] = [];
  resize$ = new BehaviorSubject<boolean>(true);
  destroy$ = new Subject<void>();
  isMetricsDataLoading = true;

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.resize$.next(true);
  }

  constructor(
    private renderer: Renderer2,
    private metricsService: MetricsService,
    private userService: UserService,
    private stringUtil: StringUtilService,
    private financialService: FinancialService,
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = subMonths(currentMonthStart, 1);

    this.userService.currentUser$
      .pipe(
        skipWhile((user) => user._id === undefined),
        take(1)
      )
      .subscribe((user) => {
        // TODO: Recalcular a cada nova transação
        this.METRICS.push({
          title: 'Recebido',
          tooltip: 'Soma dos valores recebidos por você através dos contratos no mês corrente',
          value: this.metricsService
            .userReceivedValue(user._id, currentMonthStart, today)
            .pipe(map((received) => 'R$ ' + this.stringUtil.numberToMoney(received.value))),
          description: this.metricsService
            .userReceivedValue(user._id, previousMonthStart, currentMonthStart)
            .pipe(
              map(
                (received) =>
                  'No mês passado, a soma dos valores recebidos foi R$ ' + this.stringUtil.numberToMoney(received.value)
              )
            ),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });
        this.METRICS.push({
          title: 'Despesas',
          tooltip: 'Soma das suas despesas no mês corrente',
          value: this.metricsService
            .userExpenses(user._id, currentMonthStart, today)
            .pipe(map((userExpensesMetricData) => 'R$ ' + this.stringUtil.numberToMoney(userExpensesMetricData.value))),
          description: this.metricsService
            .userExpenses(user._id, previousMonthStart, currentMonthStart)
            .pipe(
              map(
                (userExpensesMetricData) =>
                  'No mês passado, a soma de suas despesas foi R$ ' +
                  this.stringUtil.numberToMoney(userExpensesMetricData.value)
              )
            ),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });
        this.METRICS.push({
          title: 'Orçamentos em aberto',
          tooltip: 'Quantidade de orçamentos em aberto que você faz parte como equipe',
          value: this.metricsService
            .invoicesAsMember({
              uId: user._id,
              allowedStatuses: [INVOICE_STATOOS.EM_ANALISE],
              onlyNew: false,
            })
            .pipe(map((pastInvoices) => pastInvoices.count.toString())),
          description: this.metricsService
            .invoicesAsMember({
              uId: user._id,
              allowedStatuses: [INVOICE_STATOOS.EM_ANALISE],
              last: 'Mês',
              onlyNew: false,
            })
            .pipe(
              map((pastInvoices) => {
                return (
                  this.metricsService.plural('Mês', 1) +
                  ' você participou de ' +
                  (pastInvoices.count == 0 ? 'nenhum' : pastInvoices.count) +
                  (pastInvoices.count > 1 ? ' orçamentos' : ' orçamento') +
                  ' em aberto'
                );
              })
            ),
          loading: NOT(this.invoiceService.isDataLoaded$).pipe(takeUntil(this.destroy$)),
        });
        this.METRICS.push({
          title: 'Contratos em andamento',
          tooltip: 'Quantidade de contratos em andamento que você faz parte como equipe',
          value: this.contractService
            .userContractsByStatus(user._id, [CONTRACT_STATOOS.EM_ANDAMENTO])
            .pipe(map((contracts) => contracts.length.toString())),
          description: of(''),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });
        this.METRICS.push({
          title: 'Contratos a receber',
          tooltip: 'Quantidade de contratos a receber que você faz parte como equipe',
          value: this.contractService
            .userContractsByStatus(user._id, [CONTRACT_STATOOS.A_RECEBER])
            .pipe(map((contracts) => contracts.length.toString())),
          description: of(''),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });
        this.METRICS.push({
          title: 'Caixa',
          tooltip: 'Dinheiro do associado em custódia da Empresa',
          value: this.financialService.userBalance(user).pipe(map((balance) => 'R$ ' + balance)),
          description: of(''),
          loading: this.userService.currentUser$.pipe(map((user) => user._id == undefined)),
        });
        this.METRICS.push({
          title: 'Balanço do mês',
          tooltip:
            'Soma de todos os valores recebidos pelo associado no mês corrente menos as despesas como fonte pagas no mês corrente',
          value: this.metricsService
            .receivedValueNortan(currentMonthStart, today, user._id)
            .pipe(map((x) => 'R$ ' + this.stringUtil.numberToMoney(x.user))),
          description: this.metricsService.receivedValueNortan(previousMonthStart, currentMonthStart, user._id).pipe(
            map((pastPayments) => {
              return (
                this.metricsService.plural('Mês', 1) +
                ' você recebeu R$ ' +
                this.stringUtil.numberToMoney(pastPayments.user)
              );
            })
          ),
          loading: NOT(this.contractService.isDataLoaded$).pipe(takeUntil(this.destroy$)),
        });
        this.METRICS.push({
          title: 'Nº de IMPUL$$O$',
          tooltip: 'Soma do valor líquido de todas as Ordens de Empenho pagas no mês',
          value: this.metricsService
            .receivedValueNortan(currentMonthStart, today, user._id)
            .pipe(map((x) => Math.trunc(x.global / 1000).toString())),
          description: this.metricsService.receivedValueNortan(previousMonthStart, currentMonthStart, user._id).pipe(
            map((pastImpulses) => {
              return (
                this.metricsService.plural('Mês', 1) +
                ' a houveram ' +
                Math.trunc(pastImpulses.global / 1000).toString()
              );
            })
          ),
          loading: NOT(this.contractService.isDataLoaded$).pipe(takeUntil(this.destroy$)),
        });
        this.METRICS.push({
          title: 'Contratos como gestor',
          tooltip: 'Número de propostas de orçamento, criados por você, fechadas com o cliente no mês corrente',
          value: this.metricsService
            .contractsAsManager(user._id)
            .pipe(map((pastContracts) => pastContracts.count.toString())),
          description: this.metricsService.contractsAsManager(user._id, 'Mês').pipe(
            map((pastContracts) => {
              return (
                this.metricsService.plural('Mês', 1) +
                ' você fechou ' +
                (pastContracts.count == 0 ? 'nenhum' : pastContracts.count) +
                (pastContracts.count > 1 ? ' contratos' : ' contrato')
              );
            })
          ),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });
        this.METRICS.push({
          title: 'Contratos como equipe',
          tooltip:
            'Número de propostas de orçamento, a qual você faz parte da equipe, fehcadas com o cliente no mês corrente',
          value: this.metricsService
            .contractsAsMember(user._id)
            .pipe(map((pastContracts) => pastContracts.count.toString())),
          description: this.metricsService.contractsAsMember(user._id, 'Mês').pipe(
            map((pastContracts) => {
              return (
                this.metricsService.plural('Mês', 1) +
                ' você participou de ' +
                (pastContracts.count == 0 ? 'nenhum' : pastContracts.count) +
                (pastContracts.count > 1 ? ' contratos' : ' contrato')
              );
            })
          ),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });
        this.METRICS.push({
          title: 'Orçamentos como gestor',
          tooltip: 'Número de propostas de orçamento criados por você no mês corrente',
          value: this.metricsService
            .invoicesAsManager(user._id)
            .pipe(map((pastInvoices) => pastInvoices.count.toString())),
          description: this.metricsService.invoicesAsManager(user._id, 'Mês').pipe(
            map((pastInvoices) => {
              return (
                this.metricsService.plural('Mês', 1) +
                ' você enviou ' +
                (pastInvoices.count == 0 ? 'nenhum' : pastInvoices.count) +
                (pastInvoices.count > 1 ? ' orçamentos' : ' orçamento')
              );
            })
          ),
          loading: NOT(this.invoiceService.isDataLoaded$).pipe(takeUntil(this.destroy$)),
        });
        this.METRICS.push({
          title: 'Orçamentos como equipe',
          tooltip: 'Número de propostas de orçamento que você faz parta da equipe no mês corrente',
          value: this.metricsService
            .invoicesAsMember({ uId: user._id })
            .pipe(map((pastInvoices) => pastInvoices.count.toString())),
          description: this.metricsService.invoicesAsMember({ uId: user._id, last: 'Mês' }).pipe(
            map((pastInvoices) => {
              return (
                this.metricsService.plural('Mês', 1) +
                ' você participou de ' +
                (pastInvoices.count == 0 ? 'nenhum' : pastInvoices.count) +
                (pastInvoices.count > 1 ? ' orçamentos' : ' orçamento')
              );
            })
          ),
          loading: NOT(this.invoiceService.isDataLoaded$).pipe(takeUntil(this.destroy$)),
        });
        this.METRICS.push({
          title: 'IMPUL$$O$',
          tooltip:
            'Porcentagem do valor total pago ao associado em relação ao valor pago a todos os associados da empresa, no mês corrente. (R$ total recebido / R$ total pago aos associados da empresa)',
          value: this.metricsService
            .receivedValueNortan(currentMonthStart, today, user._id)
            .pipe(map((userGlobal) => this.stringUtil.toPercentageNumber(userGlobal.user, userGlobal.global))),
          description: this.metricsService
            .receivedValueNortan(previousMonthStart, currentMonthStart, user._id)
            .pipe(
              map(
                (userGlobal) =>
                  this.metricsService.plural('Mês', 1) +
                  ' foi ' +
                  this.stringUtil.toPercentageNumber(userGlobal.user, userGlobal.global)
              )
            ),
          loading: NOT(this.contractService.isDataLoaded$).pipe(takeUntil(this.destroy$)),
        });
        this.METRICS.push({
          title: 'Valor a receber',
          tooltip: 'Soma dos seus saldos e cashback de cada contrato que você faz parte',
          value: this.metricsService.userReceivableValue(user._id).pipe(
            map((userReceivable) => {
              return userReceivable.totalValue ? 'R$ ' + userReceivable.totalValue : 'R$ 0,00';
            })
          ),
          description: of(''),
          loading: combineLatest([
            this.contractService.isDataLoaded$,
            this.invoiceService.isDataLoaded$,
            this.contractorService.isDataLoaded$,
          ]).pipe(
            takeUntil(this.destroy$),
            map(
              ([isContractDataLoaded, isInvoiceDataLoaded, isContractorDataLoaded]) =>
                !(isContractDataLoaded && isInvoiceDataLoaded && isContractorDataLoaded)
            )
          ),
        });
        this.METRICS.push({
          title: 'Saldo em contratos',
          tooltip: 'Soma do seu balanço individual em cada contrato que você faz parte',
          value: this.metricsService.userBalanceSumInContracts(user._id).pipe(map((balance) => 'R$ ' + balance)),
          description: of(''),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });

        this.METRICS.push({
          title: 'Média do valor recebido',
          tooltip:
            'Soma do valor recebido por você no mês corrente dividido pela quantidade de contratos que você faz parte',
          value: this.metricsService.userReceivedValue(user._id, currentMonthStart, today).pipe(
            takeUntil(this.destroy$),
            map((userReceivedValueData) => this.userMetricsAverage(userReceivedValueData))
          ),
          description: this.metricsService.userReceivedValue(user._id, previousMonthStart, currentMonthStart).pipe(
            takeUntil(this.destroy$),
            map((userReceivedValueData) => {
              return 'No mês passado, a sua média foi de ' + this.userMetricsAverage(userReceivedValueData);
            })
          ),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });

        this.METRICS.push({
          title: 'Média das despesas',
          tooltip: 'Soma das suas despesas no mês corrente dividido pela quantidade de contratos que você faz parte',
          value: this.metricsService
            .userExpenses(user._id, currentMonthStart, today)
            .pipe(map((userExpensesMetricData) => this.userMetricsAverage(userExpensesMetricData))),
          description: this.metricsService.userExpenses(user._id, previousMonthStart, currentMonthStart).pipe(
            map((userExpensesMetricData) => {
              return 'No mês passado, a sua média das despesas foi ' + this.userMetricsAverage(userExpensesMetricData);
            })
          ),
          loading: combineLatest([this.contractService.isDataLoaded$, this.invoiceService.isDataLoaded$]).pipe(
            takeUntil(this.destroy$),
            map(([isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded))
          ),
        });

        this.isMetricsDataLoading = false;
      });
  }

  ngAfterViewInit(): void {
    combineLatest(this.METRICS.map((m) => m.loading)).subscribe((loadings) => {
      if (loadings.every((loading) => loading === false)) {
        this.resize$.pipe(takeUntil(this.destroy$)).subscribe(() => {
          setTimeout(() => {
            this.metricsRef.toArray().forEach((el) => {
              this.renderer.setStyle(el.nativeElement, 'margin-top', '0');
              if (el.nativeElement.offsetTop != this.metricsRef.first.nativeElement.offsetTop)
                this.renderer.setStyle(el.nativeElement, 'margin-top', '2rem');
            });
          }, 10);
        });
      }
    });
  }

  private userMetricsAverage(data: MetricInfo): string {
    if (data.count == 0) return 'R$ 0,00';
    return 'R$ ' + this.stringUtil.numberToMoney(data.value / data.count);
  }
}
