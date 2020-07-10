import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { NbFileUploaderOptions } from '../../../@theme/components';
import { take, takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ngx-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadDialogComponent implements OnInit {
  @Input() title: string;
  @Input() allowedMimeType: string[];
  @Input() maxFileSize: number;
  fileTypesAllowed: string[];
  hasBaseDropZoneOver: boolean;
  options: NbFileUploaderOptions;
  urls: string[] = [];

  constructor(protected ref: NbDialogRef<FileUploadDialogComponent>) {}

  ngOnInit() {
    this.fileTypesAllowed = this.allowedMimeType.map((fileType: string) =>
      fileType.substring(fileType.lastIndexOf('/') + 1, fileType.length)
    );

    this.hasBaseDropZoneOver = false;

    this.options = {
      multiple: false,
      directory: false,
      showUploadQueue: true,
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

  urlReceiver(fileList: BehaviorSubject<any>[]): void {
    this.urls = [];
    for (const file$ of fileList) {
      if (file$.getValue().isSuccess || file$.getValue().isError) {
        this.urls.push(file$.getValue().url);
      } else {
        const urlIndex = this.urls.push(file$.getValue().url) - 1;
        file$
          .pipe(take(2))
          .subscribe((file) => (this.urls[urlIndex] = file.url));
      }
    }
  }

  dismiss(): void {
    this.ref.close(this.urls);
  }

  windowWidth(): number {
    return window.innerWidth;
  }
}
