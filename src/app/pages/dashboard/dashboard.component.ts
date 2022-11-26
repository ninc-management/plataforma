import { Component } from '@angular/core';
import { NbDialogService, NbTabComponent } from '@nebular/theme';
import { endOfMonth, startOfMonth } from 'date-fns';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { map, skipWhile, take, takeUntil } from 'rxjs/operators';

import { TEAM_COMPONENT_TYPES, TeamDialogComponent } from '../teams/team-dialog/team-dialog.component';
import { CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import { MetricsService, TimeSeries } from 'app/shared/services/metrics.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { groupByDateTimeSerie, isPhone } from 'app/shared/utils';

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
export class DashboardComponent {
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
  organizationTeam!: Team;
  currentTeam = new Team();
  parettoRank: string[] = [];
  isParettoRankLoaded = false;
  isOrganizationTeamReady = false;

  isPhone = isPhone;

  constructor(
    private metricsService: MetricsService,
    private stringUtil: StringUtilService,
    private userService: UserService,
    private dialogService: NbDialogService,
    private teamService: TeamService
  ) {
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      combineLatest([this.teamService.getTeams(), this.teamService.isDataLoaded$])
        .pipe(
          skipWhile(([_, isTeamLoaded]) => !isTeamLoaded),
          takeUntil(this.destroy$)
        )
        .subscribe(([teams, _]) => {
          const organizationTeam = teams.find((team) => team.isOrganizationTeam);
          if (organizationTeam && !this.isOrganizationTeamReady) {
            this.isOrganizationTeamReady = true;
            this.organizationTeam = organizationTeam;
            this.expenses$ = metricsService
              .teamExpenses(organizationTeam._id, this.start, this.end)
              .pipe(map((metricInfo) => this.stringUtil.numberToMoney(metricInfo.value)));
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDialog(): void {
    this.dialogService.open(TeamDialogComponent, {
      context: {
        title: 'GASTOS DA EMPRESA',
        iTeam: this.organizationTeam,
        componentType: TEAM_COMPONENT_TYPES.EXPENSES,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  setActiveTab(event: NbTabComponent): void {
    switch (event.tabTitle.toLowerCase()) {
      case TAB_TITLES.PESSOAL.toLowerCase(): {
        this.activeTab = TAB_TITLES.PESSOAL;
        this.currentTeam = new Team();
        break;
      }
      case this.organizationTeam.name.toLowerCase(): {
        this.activeTab = this.organizationTeam.name;
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
