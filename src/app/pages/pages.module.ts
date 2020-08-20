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
  NbListModule,
  NbTabsetModule,
  NbRadioModule,
  NbTooltipModule,
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
import { InvoicesComponent } from './invoices/invoices.component';
import { InvoiceItemComponent } from './invoices/invoice-item/invoice-item.component';
import { InvoiceDialogComponent } from './invoices/invoice-dialog/invoice-dialog.component';
import { PaymentItemComponent } from './contracts/contract-item/payment-item/payment-item.component';
import { ContractorsComponent } from './contractors/contractors.component';
import { ContractorDialogComponent } from './contractors/contractor-dialog/contractor-dialog.component';
import { ContractorItemComponent } from './contractors/contractor-item/contractor-item.component';

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
    NbListModule,
    NbTabsetModule,
    NbTooltipModule,
    NbSpinnerModule,
    NbRadioModule,
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
    InvoicesComponent,
    InvoiceItemComponent,
    InvoiceDialogComponent,
    PaymentItemComponent,
    ContractorsComponent,
    ContractorDialogComponent,
    ContractorItemComponent,
  ],
})
export class PagesModule {}
