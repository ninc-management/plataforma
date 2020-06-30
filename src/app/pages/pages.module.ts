import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbMenuModule,
  NbCardModule,
  NbCheckboxModule,
  NbSelectModule,
  NbInputModule,
  NbButtonModule,
} from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { PagesComponent } from './pages.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { PagesRoutingModule } from './pages-routing.module';
import { ProfileComponent } from './profile/profile.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    PagesRoutingModule,
    NbCardModule,
    NbCheckboxModule,
    NbSelectModule,
    NbButtonModule,
    NbMenuModule,
    NbInputModule,
    ThemeModule,
    DashboardModule,
    FormsModule,
    SharedModule,
  ],
  declarations: [PagesComponent, ProfileComponent],
})
export class PagesModule {}
