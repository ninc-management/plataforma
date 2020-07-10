/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export declare type FilterFunction = {
  fn: (item?: File) => boolean;
};

export interface NbFileUploaderOptions {
  multiple?: boolean;
  directory?: boolean;
  showUploadQueue?: boolean;

  params?: { [key: string]: string };
  headers?: { [key: string]: string };

  allowedFileTypes?: string[];
  filter?: FilterFunction;
}

export class NbFileItem {
  rawFile: File;
  name: string;
  lastModified: number;
  progress: number = 0;
  size: number;
  type: string;
  url: string;

  isUploading: boolean = false;
  isUploaded: boolean = false;
  isSuccess: boolean = false;
  isCancel: boolean = false;
  isError: boolean = false;

  constructor(file: File) {
    this.rawFile = file;
    this.name = file.name;
    this.lastModified = file.lastModified;
    this.size = file.size;
    this.type = file.type;
    this.url = undefined;
  }

  onProgress(progress: number) {
    this.progress = Math.round(progress);
  }

  onBeforeUpload() {
    this.isUploading = true;
    this.isUploading = false;
    this.isCancel = false;
    this.isError = false;
    this.isSuccess = false;
    this.progress = 0;
  }

  onSuccess() {
    this.isUploading = false;
    this.isUploaded = true;
    this.isCancel = false;
    this.isError = false;
    this.isSuccess = true;
    this.progress = 100;
  }

  onCancel() {
    this.isUploading = false;
    this.isUploaded = false;
    this.isCancel = true;
    this.isError = false;
    this.isSuccess = false;
    this.progress = 0;
  }

  onError() {
    this.isUploading = false;
    this.isUploaded = false;
    this.isCancel = false;
    this.isError = true;
    this.isSuccess = false;
    this.progress = 0;
  }
}
