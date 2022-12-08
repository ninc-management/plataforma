import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbIconModule,
  NbInputModule,
  NbListModule,
  NbRadioModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTooltipModule,
  NbUserModule,
} from '@nebular/theme';
import * as echarts from 'echarts';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgxEchartsModule } from 'ngx-echarts';

import { NbCompleterModule, NbFileUploaderModule } from '../@theme/components';
import { BaseDialogComponent } from './components/base-dialog/base-dialog.component';
import { BaseExpenseComponent } from './components/base-expense/base-expense.component';
import { EchartsBarComponent } from './components/charts/echarts-bar/echarts-bar.component';
import { GanttChartComponent } from './components/charts/gantt-chart/gantt-chart.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { ExpansiveListComponent } from './components/expansive-list/expansive-list.component';
import { FabItemComponent } from './components/fab/fab-item/fab-item.component';
import { FabComponent } from './components/fab/fab.component';
import { FileUploadDialogComponent } from './components/file-upload/file-upload.component';
import { OneDriveDocumentUploader } from './components/onedrive-document-uploader/onedrive-document-uploader.component';
import { PdfDialogComponent } from './components/pdf-dialog/pdf-dialog.component';
import { SelectorDialogComponent } from './components/selector-dialog/selector-dialog.component';
import { TeamExpensesComponent } from './components/teams/team-expenses/team-expenses.component';
import { TransactionDialogComponent } from './components/transactions/transaction-dialog/transaction-dialog.component';
import { TransactionItemComponent } from './components/transactions/transaction-item/transaction-item.component';
import { UserTransactionComponent } from './components/user-transaction/user-transaction.component';
import { BrMaskDirective } from './directives/br-mask.directive';
import { LastPaymentDirective } from './directives/last-payment.directive';
import { OverPaidDirective } from './directives/over-paid.directive';
import { SelectAllTextDirective } from './directives/select-all-text.directive';
import { NbSmartTableModule } from 'app/@theme/components/smart-table/smart-table.module';
import { TextInputDialogComponent } from 'app/shared/components/text-input-dialog/text-input-dialog.component';
import langPTBR from 'app/shared/langPT-BR';

echarts.registerLocale('PT-BR', langPTBR);

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NbButtonModule,
    NbCardModule,
    NbCheckboxModule,
    NbCompleterModule,
    NbDatepickerModule,
    NbFileUploaderModule,
    NbIconModule,
    NbInputModule,
    NbListModule,
    NbRadioModule,
    NbSelectModule,
    NbSmartTableModule,
    NbSpinnerModule,
    NbTooltipModule,
    NbUserModule,
    PdfViewerModule,
    NgxEchartsModule.forRoot({ echarts }),
  ],
  exports: [
    BrMaskDirective,
    EchartsBarComponent,
    ExpansiveListComponent,
    FabComponent,
    FabItemComponent,
    GanttChartComponent,
    LastPaymentDirective,
    OverPaidDirective,
    SelectAllTextDirective,
    TeamExpensesComponent,
    TransactionDialogComponent,
    TransactionItemComponent,
    UserTransactionComponent,
  ],
  declarations: [
    BaseDialogComponent,
    BaseExpenseComponent,
    BrMaskDirective,
    ConfirmationDialogComponent,
    EchartsBarComponent,
    ExpansiveListComponent,
    FabComponent,
    FabItemComponent,
    FileUploadDialogComponent,
    OneDriveDocumentUploader,
    GanttChartComponent,
    LastPaymentDirective,
    OverPaidDirective,
    PdfDialogComponent,
    SelectAllTextDirective,
    SelectorDialogComponent,
    TeamExpensesComponent,
    TextInputDialogComponent,
    TransactionDialogComponent,
    TransactionItemComponent,
    UserTransactionComponent,
  ],
})
export class SharedModule {}
