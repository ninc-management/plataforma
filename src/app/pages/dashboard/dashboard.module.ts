import { NgModule } from '@angular/core';
import { NbCardModule, NbSpinnerModule } from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { DashboardComponent } from './dashboard.component';
import { ProgressSectionComponent } from './progress-section/progress-section.component';

@NgModule({
  imports: [NbCardModule, NbSpinnerModule, ThemeModule],
  declarations: [DashboardComponent, ProgressSectionComponent],
})
export class DashboardModule {}
