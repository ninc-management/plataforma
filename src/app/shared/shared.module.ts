import { NgModule } from '@angular/core';
import { NbCardModule, NbButtonModule } from '@nebular/theme';
import { BrMaskDirective } from './directives/br-mask';
import { FileUploadDialogComponent } from './components/file-upload/file-upload.component';
import { CommonModule } from '@angular/common';
import { NbFileUploaderModule } from '../@theme/components';

@NgModule({
  imports: [NbCardModule, NbButtonModule, CommonModule, NbFileUploaderModule],
  exports: [BrMaskDirective],
  declarations: [BrMaskDirective, FileUploadDialogComponent],
})
export class SharedModule {}
