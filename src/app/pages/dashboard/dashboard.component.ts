import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbAccessChecker } from '@nebular/security';
import { NbDialogService, NbTabComponent } from '@nebular/theme';
import { endOfMonth, startOfMonth } from 'date-fns';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { map, skipWhile, take, takeUntil, takeWhile } from 'rxjs/operators';

import { COMPONENT_TYPES, ContractDialogComponent } from '../contracts/contract-dialog/contract-dialog.component';
import { TEAM_COMPONENT_TYPES, TeamDialogComponent } from '../teams/team-dialog/team-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import {
  CONTRACT_STATOOS,
  CONTRACT_TRANSACTION_TYPES,
  ContractService,
  ContractTransactionInfo,
} from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { MetricsService, TimeSeries } from 'app/shared/services/metrics.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { numberToMoney } from 'app/shared/string-utils';
import { groupByDateTimeSerie, isPhone } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Team } from '@models/team';

enum TAB_TITLES {
  PESSOAL = 'Pessoal',
  TEAM = 'Time',
}

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  tabTitles = TAB_TITLES;
  activeTab: string = TAB_TITLES.PESSOAL;
  nortanIcon = {
    icon: 'logoWhite',
    pack: 'fac',
  };
  teamIcon = {
    icon: 'users',
    pack: 'fa',
  };
  start = startOfMonth(new Date());
  end = endOfMonth(new Date());
  open$: Observable<number> = of(0);
  toReceive$: Observable<number> = of(0);
  expenses$: Observable<string> = of('');
  contractsBalance$: Observable<number> = of(0);
  taxesBalance$: Observable<number> = of(0);
  timeSeries$: Observable<TimeSeries[]> = of([] as TimeSeries[]);
  teams: Team[] = [];
  nortanTeam!: Team;
  currentTeam = new Team();
  parettoRank: string[] = [];
  openOPs: ContractTransactionInfo[] = [];
  openOEs: ContractTransactionInfo[] = [];
  isParettoRankLoaded = false;
  isOPsLoaded: boolean = false;
  isOEsLoaded: boolean = false;
  isFinancialManager: boolean = false;

  isPhone = isPhone;

  constructor(
    private metricsService: MetricsService,
    private userService: UserService,
    private dialogService: NbDialogService,
    private teamService: TeamService,
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    private configService: ConfigService,
    private accessChecker: NbAccessChecker
  ) {
    this.teamService
      .getTeams()
      .pipe(
        skipWhile((teams) => teams.length == 0),
        take(1)
      )
      .subscribe((teams) => {
        const nortanTeam = teams.find((team) => team.isOrganizationTeam);
        if (nortanTeam !== undefined) {
          this.nortanTeam = nortanTeam;
          this.expenses$ = metricsService
            .teamExpenses(nortanTeam._id, this.start, this.end)
            .pipe(map((metricInfo) => numberToMoney(metricInfo.value)));
          this.open$ = metricsService
            .countContracts(CONTRACT_STATOOS.EM_ANDAMENTO)
            .pipe(map((metricInfo) => metricInfo.count));
          this.toReceive$ = metricsService
            .countContracts(CONTRACT_STATOOS.A_RECEBER)
            .pipe(map((metricInfo) => metricInfo.count));
          this.contractsBalance$ = this.metricsService
            .nortanValue(this.start, this.end)
            .pipe(map((metricInfo) => metricInfo.global));
          this.taxesBalance$ = this.metricsService
            .nortanValue(this.start, this.end, 'taxes')
            .pipe(map((metricInfo) => metricInfo.global));
        }
      });
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.teamService
        .getTeams()
        .pipe(
          skipWhile((teams) => teams.length == 0),
          takeWhile((teams) => teams.length > 0)
        )
        .subscribe(() => {
          this.teams = this.teamService.userToTeams(user).filter((team) => !team.isOrganizationTeam);
        });
      this.timeSeries$ = combineLatest([
        this.metricsService.receivedValueTimeSeries(user._id),
        this.metricsService.expensesTimeSeries(user._id),
        this.metricsService.contractValueTimeSeries(user._id),
      ]).pipe(
        map(([receivedSeriesItems, expensesSeriesItems, contractValueSeriesItems]) => {
          const received: TimeSeries = {
            name: 'Recebido',
            type: 'bar',
            smooth: false,
            cumulative: false,
            symbol: 'none',
            barGap: '-100%',
            barMaxWidth: 25,
            isMoney: true,
            data: receivedSeriesItems,
          };
          const expenses: TimeSeries = {
            name: 'Despesas',
            type: 'bar',
            smooth: false,
            cumulative: false,
            symbol: 'none',
            barGap: '-100%',
            barMaxWidth: 25,
            isMoney: true,
            data: expensesSeriesItems,
          };
          const contractsValue: TimeSeries = {
            name: 'Total em contratos',
            type: 'line',
            smooth: false,
            cumulative: true,
            symbol: 'circle',
            isMoney: true,
            data: contractValueSeriesItems,
          };
          const balance: TimeSeries = {
            name: 'Balanço',
            type: 'line',
            smooth: false,
            cumulative: true,
            symbol: 'circle',
            isMoney: true,
            data: groupByDateTimeSerie(receivedSeriesItems.concat(expensesSeriesItems)),
          };
          return [received, expenses, contractsValue, balance];
        })
      );
    });

    this.metricsService
      .parettoRank()
      .pipe(takeUntil(this.destroy$))
      .subscribe((parettoRank) => {
        this.parettoRank = parettoRank.map((contractor) => contractor.contractorName);
        this.isParettoRankLoaded = true;
      });
  }

  ngOnInit(): void {
    this.accessChecker
      .isGranted('df', 'dashboard-open-contracts')
      .pipe(take(1))
      .subscribe((isGranted) => (this.isFinancialManager = isGranted));
    combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
      this.teamService.getTeams(),
      this.configService.getConfig(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
      this.teamService.isDataLoaded$,
      this.configService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([
            ,
            ,
            ,
            ,
            ,
            isContractDataLoaded,
            isInvoiceDataLoaded,
            isContractorDataLoaded,
            isTeamDataLoaded,
            isConfigDataLoaded,
          ]) =>
            !(
              isContractDataLoaded &&
              isInvoiceDataLoaded &&
              isContractorDataLoaded &&
              isTeamDataLoaded &&
              isConfigDataLoaded
            )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([contracts, ,]) => {
        contracts = contracts.map((contract: Contract) => this.contractService.fillContract(contract));
        this.contractService
          .openItems(CONTRACT_TRANSACTION_TYPES.PAYMENTS)
          .pipe(takeUntil(this.destroy$))
          .subscribe((openOPs: ContractTransactionInfo[]) => {
            this.openOPs = openOPs;
            this.isOPsLoaded = true;
          });
        this.contractService
          .openItems(CONTRACT_TRANSACTION_TYPES.RECEIPTS)
          .pipe(takeUntil(this.destroy$))
          .subscribe((openOEs: ContractTransactionInfo[]) => {
            this.openOEs = openOEs;
            this.isOEsLoaded = true;
          });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDialog(): void {
    this.dialogService.open(TeamDialogComponent, {
      context: {
        title: 'GASTOS DA EMPRESA',
        iTeam: this.nortanTeam,
        componentType: TEAM_COMPONENT_TYPES.EXPENSES,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  // CODIGO_DO_CONTRATO - #CODIGO_DA_OP
  contractTransactionInfoToString(contractTransactionInfo: ContractTransactionInfo): string {
    if (contractTransactionInfo.contract.invoice)
      return (
        this.invoiceService.idToInvoice(contractTransactionInfo.contract.invoice).code +
        ' - #' +
        (contractTransactionInfo.code + 1).toString() +
        ' - ' +
        (contractTransactionInfo.payment ? contractTransactionInfo.payment.service : '') +
        (contractTransactionInfo.receipt ? contractTransactionInfo.receipt.description : '')
      );
    return (
      ' - #' +
      (contractTransactionInfo.code + 1).toString() +
      ' - ' +
      (contractTransactionInfo.payment ? contractTransactionInfo.payment.service : '') +
      (contractTransactionInfo.receipt ? contractTransactionInfo.receipt.description : '')
    );
  }

  openContractDialog(contractPayment: ContractTransactionInfo): void {
    const contract = contractPayment.contract;
    this.dialogService.open(ContractDialogComponent, {
      context: {
        title: 'ORDEM DE PAGAMENTO',
        contract: contract,
        paymentIndex: contractPayment.code,
        componentType: COMPONENT_TYPES.PAYMENT,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  setActiveTab(event: NbTabComponent): void {
    if (this.nortanTeam) {
      switch (event.tabTitle.toLowerCase()) {
        case TAB_TITLES.PESSOAL.toLowerCase(): {
          this.activeTab = TAB_TITLES.PESSOAL;
          this.currentTeam = new Team();
          break;
        }
        case this.nortanTeam.name.toLowerCase(): {
          this.activeTab = this.nortanTeam.name;
          this.currentTeam = this.teamService.idToTeam(event.tabId);
          break;
        }
        default: {
          this.activeTab = TAB_TITLES.TEAM;
          this.currentTeam = this.teamService.idToTeam(event.tabId);
          break;
        }
      }
    }
  }
}
