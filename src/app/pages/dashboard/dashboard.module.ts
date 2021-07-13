import { NgModule } from '@angular/core';
import {
  NbCardModule,
  NbSpinnerModule,
  NbIconModule,
  NbTooltipModule,
  NbTabsetModule,
} from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';

import { ThemeModule } from 'app/@theme/theme.module';
import { DashboardComponent } from './dashboard.component';
import { ProgressSectionComponent } from './progress-section/progress-section.component';
import { GaugeComponent } from './charts/gauge/gauge.component';

@NgModule({
  imports: [
    NbCardModule,
    NbIconModule,
    NbTabsetModule,
    NbSpinnerModule,
    NbTooltipModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    ThemeModule,
  ],
  declarations: [DashboardComponent, ProgressSectionComponent, GaugeComponent],
})
export class DashboardModule {}
