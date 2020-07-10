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
} from '@angular/core';

import { NbFileUploaderService } from './file-uploader.service';
import { NbFileUploaderOptions } from './file-uploader.model';
import { takeUntil } from 'rxjs/operators';
import { Subject, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'nb-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss'],
  providers: [NbFileUploaderService],
})
export class NbFileUploaderComponent implements OnDestroy {
  destroy$ = new Subject<void>();
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
  filesList = new EventEmitter<BehaviorSubject<any>[]>();

  get accept(): string {
    return this.options.allowedFileTypes.join(',');
  }

  constructor(public uploader: NbFileUploaderService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  browse() {
    this.inputEl.nativeElement.click();
  }

  onChange() {
    const files = this.inputEl.nativeElement.files;
    this.uploader.uploadAll(files, this.options);
    this.uploader.uploadQueue$
      .pipe(takeUntil(this.destroy$))
      .subscribe((fileList) => {
        this.filesList.emit(fileList);
      });
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }
}
