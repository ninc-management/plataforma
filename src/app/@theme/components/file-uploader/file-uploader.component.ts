/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { NbFileItem, NbFileUploaderOptions, StorageProvider } from './file-uploader.model';
import { NbFileUploaderService } from './file-uploader.service';

@Component({
  selector: 'nb-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss'],
  providers: [NbFileUploaderService],
})
export class NbFileUploaderComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  hasBaseDropZoneOver = false;

  @ViewChild('inputEl')
  inputEl!: ElementRef;

  @Input()
  options: NbFileUploaderOptions = {
    defaultInput: false,
    multiple: false,
    directory: false,
    showUploadQueue: true,
    storageProvider: StorageProvider.FIREBASE,
    mediaFolderPath: 'profileImages/',
  };

  @Input()
  isFileDrop = false;

  @Input()
  buttonLabel = 'Browse';

  @Input()
  dropAreaLabel = 'Drag files here or';

  @Input()
  dropAreaFileChooserLabel = 'browse';

  @Output()
  filesList = new EventEmitter<BehaviorSubject<NbFileItem>[]>();

  get accept(): string {
    if (this.options.allowedFileTypes) return this.options.allowedFileTypes.join(',');
    return '';
  }

  constructor(public uploader: NbFileUploaderService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {}

  browse(): void {
    this.inputEl.nativeElement.click();
  }

  onChange(): void {
    const files = this.inputEl.nativeElement.files;
    this.uploader.setFileToUpload(files, this.options);
    this.uploader.uploadAll(this.options);
    this.filesList.emit(this.uploader.uploadedFiles);
  }

  fileOverBase(e: boolean): void {
    this.hasBaseDropZoneOver = e;
  }
}
