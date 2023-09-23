import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbListModule,
  NbMenuModule,
  NbProgressBarModule,
  NbRadioModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTabsetModule,
  NbToggleModule,
  NbTooltipModule,
  NbUserModule,
} from '@nebular/theme';

import { NbFileUploaderModule } from '../@theme/components/file-uploader/file-uploader.module';
import { ThemeModule } from '../@theme/theme.module';
import { SharedModule } from '../shared/shared.module';
import { ContractorsModule } from './contractors/contractors.module';
import { ContractDialogComponent } from './contracts/contract-dialog/contract-dialog.component';
import { BalanceTabComponent } from './contracts/contract-item/balance-tab/balance-tab.component';
import { ContractItemComponent } from './contracts/contract-item/contract-item.component';
import { DataTabComponent } from './contracts/contract-item/data-tab/data-tab.component';
import { ExpenseItemComponent } from './contracts/contract-item/expense-item/expense-item.component';
import { ExpenseTabComponent } from './contracts/contract-item/expense-tab/expense-tab.component';
import { ChecklistItemDialogComponent } from './contracts/contract-item/management-tab/checklist-item-dialog/checklist-item-dialog.component';
import { ManagementTabComponent } from './contracts/contract-item/management-tab/management-tab.component';
import { PaymentItemComponent } from './contracts/contract-item/payment-item/payment-item.component';
import { PaymentTabComponent } from './contracts/contract-item/payment-tab/payment-tab.component';
import { ReceiptItemComponent } from './contracts/contract-item/receipt-item/receipt-item.component';
import { ReceiptTabComponent } from './contracts/contract-item/receipt-tab/receipt-tab.component';
import { ContractsComponent } from './contracts/contracts.component';
import { CourseDialogComponent } from './courses/course-dialog/course-dialog.component';
import { CourseItemComponent } from './courses/course-item/course-item.component';
import { CoursesComponent } from './courses/courses.component';
import { ParticipantItemComponent } from './courses/participant-item/participant-item.component';
import { ResourceItemComponent } from './courses/resource-item/resource-item.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { InvoiceDialogComponent } from './invoices/invoice-dialog/invoice-dialog.component';
import { InvoiceItemComponent } from './invoices/invoice-item/invoice-item.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { PagesRoutingModule } from './pages-routing.module';
import { PagesComponent } from './pages.component';
import { ProfileComponent } from './profile/profile.component';
import { PromotionDialogComponent } from './promotions/promotion-dialog/promotion-dialog.component';
import { PromotionItemComponent } from './promotions/promotion-item/promotion-item.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { ContactItemComponent } from './providers/contact-item/contact-item.component';
import { ProviderDialogComponent } from './providers/provider-dialog/provider-dialog/provider-dialog.component';
import { ProviderItemComponent } from './providers/provider-item/provider-item/provider-item.component';
import { ProvidersComponent } from './providers/providers.component';
import { TeamDialogComponent } from './teams/team-dialog/team-dialog.component';
import { TeamItemComponent } from './teams/team-item/team-item.component';
import { TeamsComponent } from './teams/teams.component';
import { UserDialogComponent } from './users/user-dialog/user-dialog.component';
import { UsersComponent } from './users/users.component';
import { NbSmartTableModule } from 'app/@theme/components/smart-table/smart-table.module';

@NgModule({
  imports: [
    DashboardModule,
    FormsModule,
    NbAlertModule,
    NbButtonModule,
    NbCardModule,
    NbCheckboxModule,
    NbDatepickerModule,
    NbFileUploaderModule,
    NbFormFieldModule,
    NbIconModule,
    NbInputModule,
    NbListModule,
    NbMenuModule,
    NbRadioModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTabsetModule,
    NbTooltipModule,
    NbUserModule,
    NbToggleModule,
    PagesRoutingModule,
    SharedModule,
    ThemeModule,
    NbProgressBarModule,
    NbSmartTableModule,
    ContractorsModule,
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
    ReceiptItemComponent,
    ExpenseItemComponent,
    UsersComponent,
    UserDialogComponent,
    PromotionsComponent,
    PromotionDialogComponent,
    PromotionItemComponent,
    TeamsComponent,
    TeamDialogComponent,
    TeamItemComponent,
    CourseItemComponent,
    CourseDialogComponent,
    CoursesComponent,
    ParticipantItemComponent,
    ResourceItemComponent,
    ManagementTabComponent,
    ChecklistItemDialogComponent,
    DataTabComponent,
    BalanceTabComponent,
    ReceiptTabComponent,
    PaymentTabComponent,
    ExpenseTabComponent,
    ProvidersComponent,
    ProviderDialogComponent,
    ProviderItemComponent,
    ContactItemComponent,
  ],
})
export class PagesModule {}
