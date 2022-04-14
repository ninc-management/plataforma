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
  NbUserModule,
} from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import langPTBR from 'app/shared/langPT-BR';

import { ThemeModule } from 'app/@theme/theme.module';
import { DashboardComponent } from './dashboard.component';
import { ProgressSectionComponent } from './progress-section/progress-section.component';
import { GaugeComponent } from './charts/gauge/gauge.component';
import { SharedModule } from 'app/shared/shared.module';
import { NbCompleterModule, NbFileUploaderModule } from 'app/@theme/components';
import { FormsModule } from '@angular/forms';
import { TimeSeriesComponent } from './charts/time-series/time-series.component';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { UserReceivablesComponent } from './user-receivables/user-receivables.component';
import { ReceivablesDialogComponent } from './user-receivables/receivables-dialog/receivables-dialog.component';

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
    Ng2SmartTableModule,
  ],
  declarations: [
    DashboardComponent,
    ProgressSectionComponent,
    GaugeComponent,
    TimeSeriesComponent,
    UserReceivablesComponent,
    ReceivablesDialogComponent,
  ],
})
export class DashboardModule {}
