import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbCardModule,
  NbButtonModule,
  NbIconModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTooltipModule,
  NbInputModule,
  NbListModule,
  NbUserModule,
  NbDatepickerModule,
} from '@nebular/theme';
import { BrMaskDirective } from './directives/br-mask.directive';
import { FileUploadDialogComponent } from './components/file-upload/file-upload.component';
import { CommonModule } from '@angular/common';
import { NbCompleterModule, NbFileUploaderModule } from '../@theme/components';
import { OverPaidDirective } from './directives/over-paid.directive';
import { LastPaymentDirective } from './directives/last-payment.directive';
import { PdfDialogComponent } from './components/pdf-dialog/pdf-dialog.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { BaseDialogComponent } from './components/base-dialog/base-dialog.component';
import { FabComponent } from './components/fab/fab.component';
import { FabItemComponent } from './components/fab/fab-item/fab-item.component';
import { BaseExpenseComponent } from './components/base-expense/base-expense.component';
import { SelectAllTextDirective } from './directives/select-all-text.directive';
import { TextInputDialogComponent } from 'app/shared/components/text-input-dialog/text-input-dialog.component';
import { SelectorDialogComponent } from './components/selector-dialog/selector-dialog.component';
import { TeamExpensesComponent } from './components/teams/team-expenses/team-expenses.component';
import { TeamExpenseItemComponent } from './components/teams/team-expenses/team-expense-item/team-expense-item.component';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { UserTransactionComponent } from './components/user-transaction/user-transaction.component';
import { PropertyPipe } from './pipes/property-pipe.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NbCardModule,
    NbCompleterModule,
    NbDatepickerModule,
    NbButtonModule,
    NbFileUploaderModule,
    NbIconModule,
    NbInputModule,
    NbListModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTooltipModule,
    NbUserModule,
    Ng2SmartTableModule,
    PdfViewerModule,
  ],
  exports: [
    BrMaskDirective,
    OverPaidDirective,
    LastPaymentDirective,
    FabComponent,
    FabItemComponent,
    SelectAllTextDirective,
    TeamExpensesComponent,
    TeamExpenseItemComponent,
    UserTransactionComponent,
    PropertyPipe,
  ],
  declarations: [
    BrMaskDirective,
    FileUploadDialogComponent,
    OverPaidDirective,
    LastPaymentDirective,
    PdfDialogComponent,
    ConfirmationDialogComponent,
    BaseDialogComponent,
    FabComponent,
    FabItemComponent,
    BaseExpenseComponent,
    SelectAllTextDirective,
    TextInputDialogComponent,
    SelectorDialogComponent,
    TeamExpensesComponent,
    TeamExpenseItemComponent,
    UserTransactionComponent,
    PropertyPipe,
  ],
})
export class SharedModule {}
