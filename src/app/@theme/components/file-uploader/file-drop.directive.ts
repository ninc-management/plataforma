import { Directive, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

import { NbFileUploaderOptions, StorageProvider } from './file-uploader.model';
import { NbFileUploaderService } from './file-uploader.service';

@Directive({ selector: '[nbFileDrop]' })
export class FileDropDirective implements OnInit {
  @Output() public fileOver: EventEmitter<any> = new EventEmitter();
  @Input()
  options: NbFileUploaderOptions = {
    multiple: false,
    directory: false,
    showUploadQueue: true,
    storageProvider: StorageProvider.FIREBASE,
    mediaFolderPath: 'profileImages/',
  };

  protected element: ElementRef;

  public constructor(element: ElementRef, private uploader: NbFileUploaderService) {
    this.element = element;
  }

  ngOnInit(): void {
    window.addEventListener(
      'dragover',
      (e) => {
        e && e.preventDefault();
      },
      false
    );
    window.addEventListener(
      'drop',
      (e) => {
        e && e.preventDefault();
      },
      false
    );
  }

  @HostListener('drop', ['$event'])
  public onDrop(event: any): void {
    const transfer = this._getTransfer(event);
    if (!transfer) {
      return;
    }
    this._preventAndStop(event);
    this.uploader.uploadAll(transfer.files, this.options);
    this.fileOver.emit(false);
  }

  @HostListener('dragover', ['$event'])
  public onDragOver(event: any): void {
    const transfer = this._getTransfer(event);
    if (!this._haveFiles(transfer.types)) {
      return;
    }

    transfer.dropEffect = 'copy';
    this._preventAndStop(event);
    this.fileOver.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  public onDragLeave(event: any): any {
    if ((this as any).element) {
      if (event.currentTarget === (this as any).element[0]) {
        return;
      }
    }

    this._preventAndStop(event);
    this.fileOver.emit(false);
  }

  protected _getTransfer(event: any): any {
    return event.dataTransfer ? event.dataTransfer : event.originalEvent.dataTransfer; // jQuery fix;
  }

  protected _preventAndStop(event: any): any {
    event.preventDefault();
    event.stopPropagation();
  }

  protected _haveFiles(types: any): any {
    if (!types) {
      return false;
    }

    if (types.indexOf) {
      return types.indexOf('Files') !== -1;
    } else if (types.contains) {
      return types.contains('Files');
    } else {
      return false;
    }
  }
}
