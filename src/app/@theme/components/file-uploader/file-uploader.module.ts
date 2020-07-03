/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NbProgressBarModule, NbButtonModule } from '@nebular/theme';

import { NbFileUploaderComponent } from './file-uploader.component';
import { NbUploadQueueComponent } from './upload-queue.component';
import { NbUploadQueueItemComponent } from './upload-queue-item.component';
import { FileDropDirective } from './file-drop.directive';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    NbProgressBarModule,
    NbButtonModule,
  ],
  declarations: [
    NbFileUploaderComponent,
    NbUploadQueueComponent,
    NbUploadQueueItemComponent,
    FileDropDirective,
  ],
  exports: [
    NbFileUploaderComponent,
    NbUploadQueueComponent,
    NbUploadQueueItemComponent,
  ],
  providers: [],
})
export class NbFileUploaderModule {}
