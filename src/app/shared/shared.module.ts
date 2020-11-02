import { NgModule } from '@angular/core';
import { NbCardModule, NbButtonModule, NbIconModule } from '@nebular/theme';
import { BrMaskDirective } from './directives/br-mask.directive';
import { FileUploadDialogComponent } from './components/file-upload/file-upload.component';
import { CommonModule } from '@angular/common';
import { NbFileUploaderModule } from '../@theme/components';
import { OverPaidDirective } from './directives/over-paid.directive';
import { LastPaymentDirective } from './directives/last-payment.directive';

@NgModule({
  imports: [
    NbCardModule,
    NbButtonModule,
    CommonModule,
    NbFileUploaderModule,
    NbIconModule,
  ],
  exports: [BrMaskDirective, OverPaidDirective, LastPaymentDirective],
  declarations: [
    BrMaskDirective,
    FileUploadDialogComponent,
    OverPaidDirective,
    LastPaymentDirective,
  ],
})
export class SharedModule {}
