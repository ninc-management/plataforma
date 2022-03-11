import { Component } from '@angular/core';
import { NbDialogService, NbTabComponent } from '@nebular/theme';
import { combineLatest, Observable, of } from 'rxjs';
import { map, skipWhile, take, takeWhile } from 'rxjs/operators';
import { endOfMonth, startOfMonth } from 'date-fns';
import { UtilsService } from 'app/shared/services/utils.service';
import { UserService } from 'app/shared/services/user.service';
import { MetricsService, TimeSeries } from 'app/shared/services/metrics.service';
import { TeamService } from 'app/shared/services/team.service';
import { CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import {
  COMPONENT_TYPES,
  ContractDialogComponent,
} from 'app/pages/contracts/contract-dialog/contract-dialog.component';
import { InvoiceDialogComponent } from 'app/pages/invoices/invoice-dialog/invoice-dialog.component';
import { ContractorDialogComponent } from 'app/pages/contractors/contractor-dialog/contractor-dialog.component';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { Team } from '@models/team';
import { TeamDialogComponent, TEAM_COMPONENT_TYPES } from 'app/pages/teams/team-dialog/team-dialog.component';
import { ContractorService } from 'app/shared/services/contractor.service';

enum TAB_TITLES {
  PESSOAL = 'Pessoal',
  NORTAN = 'Nortan',
  TEAM = 'Time',
}

enum DIALOG_TYPES {
  INVOICE,
  RECEIPT,
  PAYMENT,
  EXPENSE,
  CLIENT,
  NORTAN_EXPENSE_TABLE,
  TRANSFER,
}

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  tabTitles = TAB_TITLES;
  dialogTypes = DIALOG_TYPES;
  activeTab = TAB_TITLES.PESSOAL;
  nortanIcon = {
    icon: 'logoNoFill',
    pack: 'fac',
  };
  teamIcon = {
    icon: 'users',
    pack: 'fa',
  };
  start = startOfMonth(new Date());
  end = endOfMonth(new Date());
  open$: Observable<number>;
  toReceive$: Observable<number> = of(0);
  expenses$: Observable<string> = of('');
  contractsBalance$: Observable<number> = of(0);
  taxesBalance$: Observable<number> = of(0);
  timeSeries$: Observable<TimeSeries[]> = of([] as TimeSeries[]);
  teams: Team[] = [];
  nortanTeam!: Team;
  currentTeam = new Team();

  constructor(
    private metricsService: MetricsService,
    private stringUtil: StringUtilService,
    private userService: UserService,
    private dialogService: NbDialogService,
    private teamService: TeamService,
    private contractorService: ContractorService,
    public utils: UtilsService
  ) {
    this.contractorService.getContractors();
    this.teamService
      .getTeams()
      .pipe(
        skipWhile((teams) => teams.length == 0),
        take(1)
      )
      .subscribe((teams) => {
        const nortanTeam = teams.find((team) => team.name == 'Administrativo');
        if (nortanTeam !== undefined) {
          this.nortanTeam = nortanTeam;
          this.expenses$ = metricsService
            .teamExpenses(nortanTeam._id, this.start, this.end)
            .pipe(map((metricInfo) => this.stringUtil.numberToMoney(metricInfo.value)));
        }
      });
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
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.teamService
        .getTeams()
        .pipe(
          skipWhile((teams) => teams.length == 0),
          takeWhile((teams) => teams.length > 0)
        )
        .subscribe(() => {
          this.teams = this.teamService.userToTeams(user).filter((team) => team.name.toLocaleLowerCase() != 'nortan');
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
            data: this.utils.groupByDateTimeSerie(receivedSeriesItems.concat(expensesSeriesItems)),
          };
          return [received, expenses, contractsValue, balance];
        })
      );
    });
  }

  openDialog(dType: DIALOG_TYPES): void {
    switch (dType) {
      case DIALOG_TYPES.NORTAN_EXPENSE_TABLE: {
        this.dialogService.open(TeamDialogComponent, {
          context: {
            title: 'GASTOS NORTAN',
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

      case DIALOG_TYPES.EXPENSE: {
        if (this.activeTab == TAB_TITLES.PESSOAL) {
          this.dialogService.open(ContractDialogComponent, {
            context: {
              title: 'ADICIONAR DESPESA',
              componentType: COMPONENT_TYPES.EXPENSE,
            },

            dialogClass: 'my-dialog',
            closeOnBackdropClick: false,
            closeOnEsc: false,
            autoFocus: false,
          });
        } else {
          this.dialogService.open(TeamDialogComponent, {
            context: {
              title: this.activeTab === TAB_TITLES.NORTAN ? 'ADICIONAR GASTO NORTAN' : 'ADICIONAR DESPESA DO TIME',
              iTeam: this.currentTeam,
              componentType: TEAM_COMPONENT_TYPES.EXPENSE,
            },
            dialogClass: 'my-dialog',
            closeOnBackdropClick: false,
            closeOnEsc: false,
            autoFocus: false,
          });
        }
        break;
      }

      case DIALOG_TYPES.INVOICE: {
        this.dialogService.open(InvoiceDialogComponent, {
          context: {
            title: 'CADASTRO DE ORÇAMENTO',
            invoice: undefined,
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.RECEIPT: {
        this.dialogService.open(ContractDialogComponent, {
          context: {
            title: 'ADICIONAR ORDEM DE EMPENHO',
            componentType: COMPONENT_TYPES.RECEIPT,
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.PAYMENT: {
        this.dialogService.open(ContractDialogComponent, {
          context: {
            title: 'ADICIONAR ORDEM DE PAGAMENTO',
            componentType: COMPONENT_TYPES.PAYMENT,
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.CLIENT: {
        this.dialogService.open(ContractorDialogComponent, {
          context: {
            title: 'CADASTRO DE CLIENTE',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.TRANSFER: {
        this.dialogService.open(TeamDialogComponent, {
          context: {
            title: 'TRANSFERÊNCIA',
            iTeam: this.nortanTeam,
            componentType: TEAM_COMPONENT_TYPES.TRANSFER,
          },
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
      case TAB_TITLES.NORTAN.toLowerCase(): {
        this.activeTab = TAB_TITLES.NORTAN;
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
