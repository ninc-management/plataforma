import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbCardModule,
  NbButtonModule,
  NbIconModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTooltipModule,
} from '@nebular/theme';
import { BrMaskDirective } from './directives/br-mask.directive';
import { FileUploadDialogComponent } from './components/file-upload/file-upload.component';
import { CommonModule } from '@angular/common';
import { NbFileUploaderModule } from '../@theme/components';
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
import { SelectorDialogComponent } from './components/selector-dialog/selector-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NbCardModule,
    NbButtonModule,
    NbFileUploaderModule,
    NbIconModule,
    NbSelectModule,
    NbSpinnerModule,
    NbTooltipModule,
    PdfViewerModule,
  ],
  exports: [
    BrMaskDirective,
    OverPaidDirective,
    LastPaymentDirective,
    FabComponent,
    FabItemComponent,
    SelectAllTextDirective,
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
    SelectorDialogComponent,
  ],
})
export class SharedModule {}
