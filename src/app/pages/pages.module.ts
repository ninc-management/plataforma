import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import {
  NbMenuModule,
  NbCardModule,
  NbCheckboxModule,
  NbSelectModule,
  NbInputModule,
  NbButtonModule,
  NbUserModule,
  NbSpinnerModule,
  NbIconModule,
} from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { PagesComponent } from './pages.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { PagesRoutingModule } from './pages-routing.module';
import { ProfileComponent } from './profile/profile.component';
import { SharedModule } from '../shared/shared.module';
import { ContractsComponent } from './contracts/contracts.component';
import { ContractDialogComponent } from './contracts/contract-dialog/contract-dialog.component';
import { ContractItemComponent } from './contracts/contract-item/contract-item.component';

@NgModule({
  imports: [
    PagesRoutingModule,
    NbCardModule,
    NbCheckboxModule,
    NbSelectModule,
    NbButtonModule,
    NbMenuModule,
    NbInputModule,
    NbIconModule,
    NbUserModule,
    NbSpinnerModule,
    ThemeModule,
    DashboardModule,
    FormsModule,
    SharedModule,
    Ng2SmartTableModule,
  ],
  declarations: [
    PagesComponent,
    ProfileComponent,
    ContractsComponent,
    ContractDialogComponent,
    ContractItemComponent,
  ],
})
export class PagesModule {}
