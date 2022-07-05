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
import { NbDialogService } from '@nebular/theme';
import { startOfMonth, subMonths } from 'date-fns';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { map, skipWhile, take, takeUntil } from 'rxjs/operators';

import { MetricItem } from '../metric-item/metric-item.component';
import { ReceivablesDialogComponent } from 'app/pages/dashboard/user-receivables/receivables-dialog/receivables-dialog.component';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { FinancialService } from 'app/shared/services/financial.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { MetricsService } from 'app/shared/services/metrics.service';
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
    private dialogService: NbDialogService,
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
    const monthStart = startOfMonth(today);
    const previousMonth = subMonths(monthStart, 1);
    this.userService.currentUser$
      .pipe(
        skipWhile((user) => user._id === undefined),
        take(1)
      )
      .subscribe((user) => {
        // TODO: Recalcular a cada nova transação
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
            .receivedValueNortan(monthStart, today, user._id)
            .pipe(map((x) => 'R$ ' + this.stringUtil.numberToMoney(x.user))),
          description: this.metricsService.receivedValueNortan(previousMonth, monthStart, user._id).pipe(
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
            .receivedValueNortan(monthStart, today, user._id)
            .pipe(map((x) => Math.trunc(x.global / 1000).toString())),
          description: this.metricsService.receivedValueNortan(previousMonth, monthStart, user._id).pipe(
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
            .invoicesAsMember(user._id)
            .pipe(map((pastInvoices) => pastInvoices.count.toString())),
          description: this.metricsService.invoicesAsMember(user._id, 'Mês').pipe(
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
            .receivedValueNortan(monthStart, today, user._id)
            .pipe(map((userGlobal) => this.stringUtil.toPercentageNumber(userGlobal.user, userGlobal.global))),
          description: this.metricsService
            .receivedValueNortan(previousMonth, monthStart, user._id)
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
          value: this.metricsService.userBalanceSumInContracts(user._id).pipe(map((balance) => balance)),
          description: of(''),
          loading: this.contractService.isDataLoaded$.pipe(
            takeUntil(this.destroy$),
            map((isContractDataLoaded) => !isContractDataLoaded)
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
}
