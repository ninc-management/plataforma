import { NgModule } from '@angular/core';
import {
  NbCardModule,
  NbSpinnerModule,
  NbIconModule,
  NbTooltipModule,
  NbTabsetModule,
  NbInputModule,
  NbSelectModule,
  NbRadioModule,
  NbListModule,
  NbDatepickerModule,
  NbDialogModule,
  NbButtonModule,
} from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import langPTBR from 'app/shared/langPT-BR';

import { ThemeModule } from 'app/@theme/theme.module';
import { DashboardComponent } from './dashboard.component';
import { ProgressSectionComponent } from './progress-section/progress-section.component';
import { GaugeComponent } from './charts/gauge/gauge.component';
import { SharedModule } from 'app/shared/shared.module';
import { NortanExpenseItemComponent } from './nortan-expense-item/nortan-expense-item.component';
import { NbCompleterModule, NbFileUploaderModule } from 'app/@theme/components';
import { FormsModule } from '@angular/forms';
import { DashboardDialogComponent } from './dashboard-dialog/dashboard-dialog.component';
import { TimeSeriesComponent } from './charts/time-series/time-series.component';

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
    NgxEchartsModule.forRoot({ echarts }),
    SharedModule,
    ThemeModule,
  ],
  declarations: [
    DashboardComponent,
    ProgressSectionComponent,
    GaugeComponent,
    NortanExpenseItemComponent,
    DashboardDialogComponent,
    TimeSeriesComponent,
  ],
})
export class DashboardModule {}
