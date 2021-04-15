import { Component, Inject, Input } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import {
  NbFileUploaderOptions,
  StorageProvider,
  NbFileItem,
} from '../../../@theme/components';
import { take, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { UploadedFile } from '../../../@theme/components/file-uploader/file-uploader.service';

@Component({
  selector: 'ngx-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadDialogComponent extends BaseDialogComponent {
  @Input() title: string;
  @Input() allowedMimeType: string[];
  @Input() maxFileSize: number;
  fileTypesAllowed: string[];
  hasBaseDropZoneOver: boolean;
  options: NbFileUploaderOptions;
  urls: UploadedFile[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    protected derivedRef: NbDialogRef<FileUploadDialogComponent>
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
      multiple: false,
      directory: false,
      showUploadQueue: true,
      storageProvider: StorageProvider.FIREBASE,
      mediaFolderPath: 'profileImages/',
      allowedFileTypes: this.allowedMimeType,
      filter: {
        fn: (item: File) => {
          // Verifica se arquivo é maior que maxFileSize mb
          if (item.size / 1024 / 1024 > this.maxFileSize) {
            return false;
          }
          const itemType =
            item.name.substring(
              item.name.lastIndexOf('.') + 1,
              item.name.length
            ) || item.name;
          if (!this.fileTypesAllowed.includes(itemType)) {
            return false;
          }
          return true;
        },
      },
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

  dismiss(): void {
    this.derivedRef.close(this.urls);
  }
}
