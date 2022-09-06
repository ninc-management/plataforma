import { Component } from '@angular/core';
import { NbDialogService, NbTabComponent } from '@nebular/theme';
import { endOfMonth, startOfMonth } from 'date-fns';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { map, skipWhile, take, takeUntil, takeWhile } from 'rxjs/operators';

import { TEAM_COMPONENT_TYPES, TeamDialogComponent } from '../teams/team-dialog/team-dialog.component';
import { ReportMenuDialogComponent } from './report-menu-dialog/report-menu-dialog.component';
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

enum DIALOG_TYPES {
  NORTAN_EXPENSE_TABLE,
  REPORT_MENU,
}

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private destroy$ = new Subject<void>();

  tabTitles = TAB_TITLES;
  dialogTypes = DIALOG_TYPES;
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
  isParettoRankLoaded = false;

  isPhone = isPhone;

  constructor(
    private metricsService: MetricsService,
    private stringUtil: StringUtilService,
    private userService: UserService,
    private dialogService: NbDialogService,
    private teamService: TeamService
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDialog(dType: DIALOG_TYPES): void {
    switch (dType) {
      case DIALOG_TYPES.NORTAN_EXPENSE_TABLE: {
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
        break;
      }

      case DIALOG_TYPES.REPORT_MENU: {
        this.dialogService.open(ReportMenuDialogComponent, {
          context: {},
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      default:
        break;
    }
  }

  setActiveTab(event: NbTabComponent): void {
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
