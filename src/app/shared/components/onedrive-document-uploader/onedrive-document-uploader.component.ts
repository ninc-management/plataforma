import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { BehaviorSubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { NbFileItem, NbFileUploaderOptions, StorageProvider } from 'app/@theme/components';
import { OneDriveFolders, OneDriveService } from 'app/shared/services/onedrive.service';
import { compareFiles } from 'app/shared/utils';

import { UploadedFile, UploadedFileWithDescription } from '@models/shared/uploadedFiles';

interface fileInfo {
  file: UploadedFile[] | UploadedFileWithDescription[];
  oneDriveFolder: OneDriveFolders;
}

@Component({
  selector: 'ngx-onedrive-document-uploader',
  template: '',
  styleUrls: ['./onedrive-document-uploader.component.scss'],
})
export abstract class OneDriveDocumentUploader implements OnInit, OnDestroy {
  @Output()
  submit: EventEmitter<boolean> = new EventEmitter<boolean>();
  protected destroy$ = new Subject<void>();
  protected newDocument$ = new Subject<void>();
  protected isAllFilesUploaded$ = new Subject<void>();
  uploadedFiles: UploadedFile[] | UploadedFileWithDescription[] = [];
  initialFiles: UploadedFile[] | UploadedFileWithDescription[] = [];
  private folderPath: string = '';
  private filesToRemove: fileInfo[] = [];

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

  constructor(protected onedrive: OneDriveService, protected dialogService: NbDialogService) {
    this.fileTypesAllowed = this.allowedMimeType.map((fileType: string) =>
      fileType.substring(fileType.lastIndexOf('/') + 1, fileType.length)
    );
    this.submit.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resolveRemoval();
    });
  }

  ngOnInit(): void {
    this.initializeFilesList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.newDocument$.next();
    this.newDocument$.complete();
  }

  abstract initializeFilesList(): void;

  updateFolderPath(folderPath: string) {
    this.folderPath = folderPath;
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

  urlReceiver(uploadedFiles: BehaviorSubject<NbFileItem>[]): void {
    uploadedFiles.forEach((file$) => {
      if (file$)
        file$.pipe(takeUntil(this.newDocument$), take(2)).subscribe((file) => {
          if (file$.getValue().isSuccess) {
            this.uploadedFiles.push({ name: file.name, url: file.url, description: '' });
            if (this.uploadedFiles.length == uploadedFiles.filter((file$) => file$).length)
              this.isAllFilesUploaded$.next();
          }
        });
    });
  }

  removeFile(index: number, oneDriveFolder: OneDriveFolders): void {
    this.filesToRemove.push({
      file: this.uploadedFiles.splice(index, 1),
      oneDriveFolder: oneDriveFolder,
    });
  }

  resolveRemoval(): void {
    this.filesToRemove.forEach((fileInfo) => {
      this.onedrive.deleteFiles(this.folderPath, fileInfo.file, fileInfo.oneDriveFolder);
    });
  }

  deleteFiles(): void {
    const filesToRemove = this.uploadedFiles.filter((file) => !compareFiles(this.initialFiles, file));
    if (filesToRemove.length > 0) this.onedrive.deleteFiles(this.folderPath, filesToRemove, OneDriveFolders.CONTRACTS);
  }
}
