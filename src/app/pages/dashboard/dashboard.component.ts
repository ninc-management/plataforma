import { Component } from '@angular/core';
import { UtilsService } from 'app/shared/services/utils.service';
import { MetricsService } from 'app/shared/services/metrics.service';
import { startOfMonth } from 'date-fns';
import { CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NbDialogService, NbTabComponent } from '@nebular/theme';
import {
  COMPONENT_TYPES,
  ContractDialogComponent,
} from '../contracts/contract-dialog/contract-dialog.component';
import { DashboardDialogComponent } from './dashboard-dialog/dashboard-dialog.component';

enum TAB_TITLES {
  PESSOAL = 'Pessoal',
  NORTAN = 'Nortan',
}

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  tabTitles = TAB_TITLES;
  activeTab = TAB_TITLES.PESSOAL;
  nortanIcon = {
    icon: 'logoNoFill',
    pack: 'fac',
  };
  start = startOfMonth(new Date());
  end = new Date();
  open$!: Observable<number>;
  toReceive$!: Observable<number>;
  contractsBalance$!: Observable<number>;
  taxesBalance$!: Observable<number>;

  constructor(
    private metricsService: MetricsService,
    private dialogService: NbDialogService,
    public utils: UtilsService
  ) {
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

  openDialog(): void {
    if (this.activeTab == TAB_TITLES.NORTAN) {
      this.dialogService.open(DashboardDialogComponent, {
        context: {
          title: 'ADICIONAR GASTO NORTAN',
          expenseIndex: undefined,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      });
    } else {
      this.dialogService.open(ContractDialogComponent, {
        context: {
          title: 'ADICIONAR DESPESA',
          expenseIndex: undefined,
          componentType: COMPONENT_TYPES.EXPENSE,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      });
    }
  }

  setActiveTab(event: NbTabComponent): void {
    switch (event.tabTitle) {
      case TAB_TITLES.PESSOAL: {
        this.activeTab = TAB_TITLES.PESSOAL;
        break;
      }
      case TAB_TITLES.NORTAN: {
        this.activeTab = TAB_TITLES.NORTAN;
        break;
      }
      default: {
        this.activeTab = TAB_TITLES.PESSOAL;
        break;
      }
    }
  }
}
