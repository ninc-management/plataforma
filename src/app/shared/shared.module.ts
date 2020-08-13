import { NgModule } from '@angular/core';
import { NbCardModule, NbButtonModule } from '@nebular/theme';
import { BrMaskDirective } from './directives/br-mask.directive';
import { FileUploadDialogComponent } from './components/file-upload/file-upload.component';
import { CommonModule } from '@angular/common';
import { NbFileUploaderModule } from '../@theme/components';
import { OverPaidDirective } from './directives/over-paid.directive';

@NgModule({
  imports: [NbCardModule, NbButtonModule, CommonModule, NbFileUploaderModule],
  exports: [BrMaskDirective, OverPaidDirective],
  declarations: [BrMaskDirective, FileUploadDialogComponent, OverPaidDirective],
})
export class SharedModule {}
