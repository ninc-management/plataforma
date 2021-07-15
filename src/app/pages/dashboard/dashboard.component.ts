import { Component } from '@angular/core';
import { UtilsService } from 'app/shared/services/utils.service';
import { MetricsService } from 'app/shared/services/metrics.service';
import { startOfMonth } from 'date-fns';
import { CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NbDialogService } from '@nebular/theme';
import {
  ComponentTypes,
  ContractDialogComponent,
} from '../contracts/contract-dialog/contract-dialog.component';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
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
    const title = 'ADICIONAR DESPESA';

    this.dialogService.open(ContractDialogComponent, {
      context: {
        title: title,
        expenseIndex: undefined,
        componentType: ComponentTypes.EXPENSE,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
