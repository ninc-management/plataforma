import { Component } from '@angular/core';
import { NbDialogService, NbTabComponent } from '@nebular/theme';
import { combineLatest, Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { startOfMonth } from 'date-fns';
import { UtilsService } from 'app/shared/services/utils.service';
import { UserService } from 'app/shared/services/user.service';
import {
  MetricsService,
  TimeSeries,
} from 'app/shared/services/metrics.service';
import { CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import {
  COMPONENT_TYPES,
  ContractDialogComponent,
} from '../contracts/contract-dialog/contract-dialog.component';
import { DashboardDialogComponent } from './dashboard-dialog/dashboard-dialog.component';
import { InvoiceDialogComponent } from '../invoices/invoice-dialog/invoice-dialog.component';
import { ContractorDialogComponent } from '../contractors/contractor-dialog/contractor-dialog.component';

enum TAB_TITLES {
  PESSOAL = 'Pessoal',
  NORTAN = 'Nortan',
}

enum DIALOG_TYPES {
  INVOICE,
  RECEIPT,
  PAYMENT,
  EXPENSE,
  CLIENT,
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
  start = startOfMonth(new Date());
  end = new Date();
  open$!: Observable<number>;
  toReceive$!: Observable<number>;
  contractsBalance$!: Observable<number>;
  taxesBalance$!: Observable<number>;
  timeSeries$: Observable<TimeSeries[]> = of([] as TimeSeries[]);

  constructor(
    private metricsService: MetricsService,
    private userService: UserService,
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
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.timeSeries$ = combineLatest([
        this.metricsService.receivedValueTimeSeries(user._id),
        this.metricsService.expensesTimeSeries(user._id),
        this.metricsService.contractValueTimeSeries(user._id),
      ]).pipe(
        map(
          ([
            receivedSeriesItems,
            expensesSeriesItems,
            contractValueSeriesItems,
          ]) => {
            const received: TimeSeries = {
              name: 'Recebido',
              type: 'bar',
              smooth: false,
              cumulative: false,
              symbol: 'none',
              data: receivedSeriesItems,
            };
            const expenses: TimeSeries = {
              name: 'Despesas',
              type: 'bar',
              smooth: false,
              cumulative: false,
              symbol: 'none',
              data: expensesSeriesItems,
            };
            const contractsValue: TimeSeries = {
              name: 'Valor em contratos',
              type: 'line',
              smooth: false,
              cumulative: true,
              symbol: 'none',
              data: contractValueSeriesItems,
            };
            return [received, expenses, contractsValue];
          }
        )
      );
    });
  }

  openDialog(dType: DIALOG_TYPES): void {
    switch (dType) {
      case DIALOG_TYPES.EXPENSE: {
        if (this.activeTab == TAB_TITLES.NORTAN) {
          this.dialogService.open(DashboardDialogComponent, {
            context: {
              title: 'ADICIONAR GASTO NORTAN',
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
              componentType: COMPONENT_TYPES.EXPENSE,
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

      default:
        break;
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
