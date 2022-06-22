/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NbButtonModule, NbProgressBarModule } from '@nebular/theme';

import { FileDropDirective } from './file-drop.directive';
import { NbFileUploaderComponent } from './file-uploader.component';
import { NbUploadQueueItemComponent } from './upload-queue-item.component';
import { NbUploadQueueComponent } from './upload-queue.component';

@NgModule({
  imports: [CommonModule, NbProgressBarModule, NbButtonModule],
  declarations: [NbFileUploaderComponent, NbUploadQueueComponent, NbUploadQueueItemComponent, FileDropDirective],
  exports: [NbFileUploaderComponent, NbUploadQueueComponent, NbUploadQueueItemComponent],
  providers: [],
})
export class NbFileUploaderModule {}
