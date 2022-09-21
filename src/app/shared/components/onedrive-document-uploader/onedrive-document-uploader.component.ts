import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { NbFileItem, NbFileUploaderOptions, StorageProvider } from 'app/@theme/components';
import { OneDriveService } from 'app/shared/services/onedrive.service';

import { descriptionUploadedFile } from '@models/shared';

@Component({
  selector: 'ngx-onedrive-document-uploader',
  template: '',
  styleUrls: ['./onedrive-document-uploader.component.scss'],
})
export class OneDriveDocumentUploader implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();
  protected newDocument$ = new Subject<void>();
  uploadedFiles: descriptionUploadedFile[] = [];

  uploaderOptions: NbFileUploaderOptions = {
    multiple: true,
    directory: false,
    showUploadQueue: true,
    storageProvider: StorageProvider.ONEDRIVE,
    mediaFolderPath: 'profileImages/',
  };
  allowedMimeType = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
  fileTypesAllowed: string[] = [];
  maxFileSize = 4;

  constructor(protected onedrive: OneDriveService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.newDocument$.next();
    this.newDocument$.complete();
  }

  ngOnInit(): void {
    this.fileTypesAllowed = this.allowedMimeType.map((fileType: string) =>
      fileType.substring(fileType.lastIndexOf('/') + 1, fileType.length)
    );
  }

  updateUploaderOptions(folderPath: string, nameFn: (name: string) => string, onedriveFolder?: string): void {
    this.uploaderOptions = {
      multiple: true,
      directory: false,
      showUploadQueue: true,
      storageProvider: StorageProvider.ONEDRIVE,
      mediaFolderPath: folderPath,
      oneDriveFolder: onedriveFolder,
      allowedFileTypes: this.allowedMimeType,

      filter: {
        fn: (item?: File) => {
          if (!item) return false;
          // Verifica se arquivo é maior que maxFileSize mb
          if (item.size / 1024 / 1024 > this.maxFileSize) {
            return false;
          }
          const itemType = item.name.substring(item.name.lastIndexOf('.') + 1, item.name.length) || item.name;
          if (!this.fileTypesAllowed.includes(itemType)) {
            return false;
          }
          return true;
        },
      },
      name: {
        fn: nameFn,
      },
    };
  }

  urlReceiver(uploadedFile$: Observable<BehaviorSubject<NbFileItem>>): void {
    uploadedFile$.pipe(takeUntil(this.newDocument$)).subscribe((file$) => {
      if (file$)
        file$.pipe(take(2)).subscribe((file) => {
          if (file$.getValue().isSuccess) this.uploadedFiles.push({ name: file.name, url: file.url, description: '' });
        });
    });
  }

  removeFile(index: number): void {
    //TODO: Remove file on Onedrive
    this.uploadedFiles.splice(index, 1);
  }
}
