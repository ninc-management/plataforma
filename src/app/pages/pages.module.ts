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
  NbDatepickerModule,
  NbAlertModule,
  NbFormFieldModule,
} from '@nebular/theme';
import { ThemeModule } from '../@theme/theme.module';
import { NbFileUploaderModule } from '../@theme/components/file-uploader/file-uploader.module';
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
import { ReceiptItemComponent } from './contracts/contract-item/receipt-item/receipt-item.component';
import { ExpenseItemComponent } from './contracts/contract-item/expense-item/expense-item.component';
import { UsersComponent } from './users/users.component';
import { UserDialogComponent } from './users/user-dialog/user-dialog.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { PromotionDialogComponent } from './promotions/promotion-dialog/promotion-dialog.component';
import { PromotionItemComponent } from './promotions/promotion-item/promotion-item.component';
import { TeamsComponent } from './teams/teams.component';
import { TeamDialogComponent } from './teams/team-dialog/team-dialog.component';
import { TeamItemComponent } from './teams/team-item/team-item.component';
import { CourseItemComponent } from './courses/course-item/course-item.component';
import { CourseDialogComponent } from './courses/course-dialog/course-dialog.component';
import { CoursesComponent } from './courses/courses.component';
import { ParticipantItemComponent } from './courses/participant-item/participant-item.component';
import { ResourceItemComponent } from './courses/resource-item/resource-item.component';
import { TextInputDialogComponent } from 'app/shared/components/text-input-dialog/text-input-dialog.component';

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
    Ng2SmartTableModule,
    PagesRoutingModule,
    SharedModule,
    ThemeModule,
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
    TextInputDialogComponent,
  ],
})
export class PagesModule {}
