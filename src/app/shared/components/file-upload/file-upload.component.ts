import { Component, Inject, Input, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { NbFileItem, NbFileUploaderOptions, StorageProvider } from '../../../@theme/components';
import { UploadedFile } from '../../../@theme/components/file-uploader/file-uploader.service';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

@Component({
  selector: 'ngx-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadDialogComponent extends BaseDialogComponent {
  @Input() title = '';
  @Input() allowedMimeType: string[] = [];
  @Input() maxFileSize = 0;
  @Input() multiple = false;
  @Input() directory = false;
  @Input() showUploadQueue = true;
  @Input() storageProvider = StorageProvider.FIREBASE;
  @Input() mediaFolderPath = 'profileImages/';
  @Input() filter = {
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
  };
  @Input() name: any = undefined;
  fileTypesAllowed: string[] = [];
  hasBaseDropZoneOver = false;
  options!: NbFileUploaderOptions;
  urls: UploadedFile[] = [];

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<FileUploadDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.fileTypesAllowed = this.allowedMimeType.map((fileType: string) =>
      fileType.substring(fileType.lastIndexOf('/') + 1, fileType.length)
    );

    this.hasBaseDropZoneOver = false;

    this.options = {
      multiple: this.multiple,
      directory: this.directory,
      showUploadQueue: this.showUploadQueue,
      storageProvider: this.storageProvider,
      mediaFolderPath: this.mediaFolderPath,
      allowedFileTypes: this.allowedMimeType,
      filter: this.filter,
      name: this.name,
    };
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  urlReceiver(uploadedFile$: Observable<BehaviorSubject<NbFileItem>>): void {
    uploadedFile$.pipe(takeUntil(this.destroy$)).subscribe((file$) => {
      if (file$)
        file$.pipe(take(2)).subscribe((file) => {
          if (file$.getValue().isSuccess) {
            this.urls.push({ name: file.name, url: file.url });
            this.dismiss();
          }
        });
    });
  }

  blur(event: FocusEvent): void {
    if (event.srcElement) (event.srcElement as HTMLInputElement).blur();
  }

  dismiss(): void {
    this.derivedRef.close(this.urls);
  }
}
