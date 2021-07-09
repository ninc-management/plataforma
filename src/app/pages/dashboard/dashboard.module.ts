import { NgModule } from '@angular/core';
import {
  NbCardModule,
  NbSpinnerModule,
  NbIconModule,
  NbTooltipModule,
  NbTabsetModule,
} from '@nebular/theme';

import { ThemeModule } from 'app/@theme/theme.module';
import { DashboardComponent } from './dashboard.component';
import { ProgressSectionComponent } from './progress-section/progress-section.component';

@NgModule({
  imports: [
    NbCardModule,
    NbIconModule,
    NbTabsetModule,
    NbSpinnerModule,
    NbTooltipModule,
    ThemeModule,
  ],
  declarations: [DashboardComponent, ProgressSectionComponent],
})
export class DashboardModule {}
