import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbButtonModule,
  NbCardModule,
  NbDatepickerModule,
  NbDialogModule,
  NbIconModule,
  NbInputModule,
  NbListModule,
  NbRadioModule,
  NbSelectModule,
  NbSpinnerModule,
  NbStepperModule,
  NbTabsetModule,
  NbTooltipModule,
  NbUserModule,
} from '@nebular/theme';
import * as echarts from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';

import { GaugeComponent } from './charts/gauge/gauge.component';
import { TimeSeriesComponent } from './charts/time-series/time-series.component';
import { DashboardComponent } from './dashboard.component';
import { ExpansiveGridComponent } from './expansive-grid/expansive-grid.component';
import { MetricItemComponent } from './metric-item/metric-item.component';
import { ProgressSectionComponent } from './progress-section/progress-section.component';
import { ReportMenuDialogComponent } from './report-menu-dialog/report-menu-dialog.component';
import { AnnualReportComponent } from './report-menu/annual-report/annual-report.component';
import { ContractExpensesReportComponent } from './report-menu/contract-expenses-report/contract-expenses-report.component';
import { OngoingContractsReportComponent } from './report-menu/ongoing-contracts-report/ongoing-contracts-report.component';
import { ReceiptReportComponent } from './report-menu/receipt-report/receipt-report.component';
import { ReportMenuComponent } from './report-menu/report-menu.component';
import { ReceivablesDialogComponent } from './user-receivables/receivables-dialog/receivables-dialog.component';
import { UserReceivablesComponent } from './user-receivables/user-receivables.component';
import { NbCompleterModule, NbFileUploaderModule } from 'app/@theme/components';
import { NbSmartTableModule } from 'app/@theme/components/smart-table/smart-table.module';
import { ThemeModule } from 'app/@theme/theme.module';
import langPTBR from 'app/shared/langPT-BR';
import { SharedModule } from 'app/shared/shared.module';

echarts.registerLocale('PT-BR', langPTBR);

@NgModule({
  imports: [
    FormsModule,
    NbButtonModule,
    NbCardModule,
    NbCompleterModule,
    NbDatepickerModule,
    NbDialogModule,
    NbFileUploaderModule,
    NbIconModule,
    NbInputModule,
    NbListModule,
    NbRadioModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTabsetModule,
    NbTooltipModule,
    NbUserModule,
    NgxEchartsModule.forRoot({ echarts }),
    SharedModule,
    ThemeModule,
    NbSmartTableModule,
    NbStepperModule,
  ],
  declarations: [
    DashboardComponent,
    ProgressSectionComponent,
    GaugeComponent,
    TimeSeriesComponent,
    UserReceivablesComponent,
    ReceivablesDialogComponent,
    MetricItemComponent,
    ExpansiveGridComponent,
    ReportMenuDialogComponent,
    ReportMenuComponent,
    OngoingContractsReportComponent,
    AnnualReportComponent,
    ContractExpensesReportComponent,
    ReceiptReportComponent,
  ],
})
export class DashboardModule {}
