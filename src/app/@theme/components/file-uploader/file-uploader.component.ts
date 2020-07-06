/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
} from '@angular/core';

import { NbFileUploaderService } from './file-uploader.service';
import { NbFileUploaderOptions } from './file-uploader.model';

@Component({
  selector: 'nb-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss'],
  providers: [NbFileUploaderService],
})
export class NbFileUploaderComponent {
  hasBaseDropZoneOver: boolean;

  @ViewChild('inputEl')
  inputEl: ElementRef;

  @Input()
  options: NbFileUploaderOptions = {
    multiple: false,
    directory: false,
    showUploadQueue: true,
  };

  @Input()
  isFileDrop: boolean;

  @Input()
  buttonLabel = 'Browse';

  @Input()
  dropAreaLabel = 'Drag files here or';

  @Input()
  dropAreaFileChooserLabel = 'browse';

  @Output()
  selectFile = new EventEmitter<File[]>();

  get accept(): string {
    return this.options.allowedFileTypes.join(',');
  }

  constructor(public uploader: NbFileUploaderService) {}

  browse() {
    this.inputEl.nativeElement.click();
  }

  onChange() {
    const files = this.inputEl.nativeElement.files;
    this.uploader.uploadAll(files, this.options);
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }
}
