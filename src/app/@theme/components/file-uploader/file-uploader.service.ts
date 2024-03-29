/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject } from 'rxjs';
import { catchError, filter, map, takeUntil } from 'rxjs/operators';

import { StorageService } from '../../../shared/services/storage.service';
import { FilterFunction, NbFileItem, NbFileUploaderOptions } from './file-uploader.model';

export interface UploadedFile {
  name: string;
  url: string;
}

@Injectable()
export class NbFileUploaderService implements OnDestroy {
  private destroy$ = new Subject<void>();
  uploadQueue$ = new BehaviorSubject<BehaviorSubject<NbFileItem>[]>([]);

  constructor(private storageService: StorageService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* eslint-disable indent */
  get uploadedFiles$(): Observable<BehaviorSubject<NbFileItem>> {
    return this.uploadQueue$.pipe(
      map((fileList: BehaviorSubject<NbFileItem>[]): BehaviorSubject<NbFileItem> | undefined =>
        fileList.slice(-1).pop()
      ),
      filter((file): file is BehaviorSubject<NbFileItem> => file != undefined)
    );
  }
  /* eslint-enble indent */

  private isUploadedFile(obj: any): obj is UploadedFile {
    return obj.name !== undefined;
  }

  getPreparedFiles(files: FileList, filter: FilterFunction): BehaviorSubject<NbFileItem>[] {
    if (filter) {
      return Array.from(files)
        .filter(filter.fn)
        .map((file: File) => new BehaviorSubject(new NbFileItem(file)));
    }
    return Array.from(files).map((file: File) => new BehaviorSubject(new NbFileItem(file)));
  }

  uploadAll(fileList: FileList, options: NbFileUploaderOptions): void {
    if (!options.filter) return;
    const files: BehaviorSubject<NbFileItem>[] = this.getPreparedFiles(fileList, options.filter);
    if (!files) return;
    this.addToQueue(files);
    files.forEach((file: BehaviorSubject<NbFileItem>) => this.upload(file, options));
  }

  private addToQueue(files: BehaviorSubject<NbFileItem>[]) {
    files.forEach((file) => {
      const tmp = this.uploadQueue$.value;
      tmp.push(file);
      this.uploadQueue$.next(tmp);
    });
  }

  private upload(file: BehaviorSubject<NbFileItem>, options: NbFileUploaderOptions) {
    const tempFile = file.getValue();
    tempFile.onBeforeUpload();
    if (options.name != undefined) tempFile.name = options.name.fn(tempFile.name);

    const { downloadUrl$, uploadProgress$ } = this.storageService.uploadFileAndGetMetadata(
      options.mediaFolderPath,
      tempFile.rawFile,
      tempFile.name,
      options.storageProvider,
      options.oneDriveFolder
    );

    uploadProgress$.pipe(takeUntil(this.destroy$)).subscribe((progress: number) => {
      tempFile.onProgress(progress);
      file.getValue().onProgress(progress);
    });

    downloadUrl$
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: any) => {
          tempFile.onError();
          file.next(tempFile);
          return EMPTY;
        })
      )
      .subscribe((downloadUrl: UploadedFile | string) => {
        if (this.isUploadedFile(downloadUrl)) {
          tempFile.url = downloadUrl.url;
          tempFile.name = downloadUrl.name;
        } else tempFile.url = downloadUrl;
        tempFile.onSuccess();
        file.next(tempFile);
      });
  }
}
