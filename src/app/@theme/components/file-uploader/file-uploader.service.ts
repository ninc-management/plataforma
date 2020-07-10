/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Injectable, OnDestroy } from '@angular/core';
import {
  Observable,
  of as observableOf,
  Subject,
  EMPTY,
  BehaviorSubject,
} from 'rxjs';

import {
  NbFileUploaderOptions,
  NbFileItem,
  FilterFunction,
} from './file-uploader.model';
import { StorageService } from '../../../shared/services/storage.service';
import { takeUntil, catchError } from 'rxjs/operators';

@Injectable()
export class NbFileUploaderService implements OnDestroy {
  private uploadQueue: BehaviorSubject<NbFileItem>[] = [];
  destroy$ = new Subject<void>();

  constructor(private storageService: StorageService) {}

  get uploadQueue$(): Observable<BehaviorSubject<NbFileItem>[]> {
    return observableOf(this.uploadQueue);
  }

  getPreparedFiles(
    files: FileList,
    filter: FilterFunction
  ): BehaviorSubject<NbFileItem>[] {
    if (filter) {
      return Array.from(files)
        .filter(filter.fn)
        .map((file: File) => new BehaviorSubject(new NbFileItem(file)));
    }
    return Array.from(files).map(
      (file: File) => new BehaviorSubject(new NbFileItem(file))
    );
  }

  uploadAll(fileList: FileList, options: NbFileUploaderOptions): void {
    const files: BehaviorSubject<NbFileItem>[] = this.getPreparedFiles(
      fileList,
      options.filter
    );
    if (!files) {
      return;
    }
    this.addToQueue(files);
    files.forEach((file: BehaviorSubject<NbFileItem>) =>
      this.upload(file, options)
    );
  }

  private addToQueue(files: BehaviorSubject<NbFileItem>[]) {
    this.uploadQueue.push(...files);
  }

  private upload(
    file: BehaviorSubject<NbFileItem>,
    options: NbFileUploaderOptions
  ) {
    let tempFile = file.getValue();
    tempFile.onBeforeUpload();

    const mediaFolderPath = `profileImages/`;

    const {
      downloadUrl$,
      uploadProgress$,
    } = this.storageService.uploadFileAndGetMetadata(
      mediaFolderPath,
      tempFile.rawFile
    );

    uploadProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((progress: number) => {
        tempFile.onProgress(progress);
        file.getValue().onProgress(progress);
      });

    downloadUrl$
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          tempFile.onError();
          file.next(tempFile);
          return EMPTY;
        })
      )
      .subscribe((downloadUrl) => {
        tempFile.url = downloadUrl;
        tempFile.onSuccess();
        file.next(tempFile);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
