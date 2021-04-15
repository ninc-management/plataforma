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
  OnDestroy,
  OnInit,
} from '@angular/core';

import { NbFileUploaderService } from './file-uploader.service';
import {
  NbFileUploaderOptions,
  StorageProvider,
  NbFileItem,
} from './file-uploader.model';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'nb-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss'],
  providers: [NbFileUploaderService],
})
export class NbFileUploaderComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  hasBaseDropZoneOver: boolean;

  @ViewChild('inputEl')
  inputEl: ElementRef;

  @Input()
  options: NbFileUploaderOptions = {
    multiple: false,
    directory: false,
    showUploadQueue: true,
    storageProvider: StorageProvider.FIREBASE,
    mediaFolderPath: 'profileImages/',
  };

  @Input()
  isFileDrop: boolean;

  @Input()
  buttonLabel = 'Browse';

  @Input()
  dropAreaLabel = 'Drag files here or';

  @Input()
  dropAreaFileChooserLabel = 'browse';

  /* eslint-disable @typescript-eslint/indent */
  @Output()
  filesList = new EventEmitter<Observable<BehaviorSubject<NbFileItem>>>();
  /* eslint-enable @typescript-eslint/indent */

  get accept(): string {
    return this.options.allowedFileTypes.join(',');
  }

  constructor(public uploader: NbFileUploaderService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.filesList.emit(this.uploader.uploadedFiles$);
  }

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
