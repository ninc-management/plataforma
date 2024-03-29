import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { NbFileItem, NbFileUploaderOptions, StorageProvider } from 'app/@theme/components';
import { OneDriveFolders, OneDriveService } from 'app/shared/services/onedrive.service';

import { UploadedFile, UploadedFileWithDescription } from '@models/shared/uploadedFiles';

@Component({
  selector: 'ngx-onedrive-document-uploader',
  template: '',
  styleUrls: ['./onedrive-document-uploader.component.scss'],
})
export class OneDriveDocumentUploader implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();
  protected newDocument$ = new Subject<void>();
  uploadedFiles: UploadedFile[] | UploadedFileWithDescription[] = [];

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

  constructor(protected onedrive: OneDriveService, protected dialogService: NbDialogService) {}

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

  removeFile(index: number, path: string, oneDriveFolder: OneDriveFolders): void {
    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question: 'Deseja remover o arquivo permanentemente?',
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response: boolean) => {
        if (response) {
          this.onedrive.deleteFiles(path, [this.uploadedFiles[index]], oneDriveFolder);
          this.uploadedFiles.splice(index, 1);
        }
      });
  }
}
