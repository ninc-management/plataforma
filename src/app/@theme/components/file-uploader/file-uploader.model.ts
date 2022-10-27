/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export declare type FilterFunction = {
  fn: (item?: File) => boolean;
};

export declare type NameFunction = {
  fn: (name: string) => string;
};

export enum StorageProvider {
  FIREBASE,
  ONEDRIVE,
}

export interface NbFileUploaderOptions {
  defaultInput?: boolean;
  multiple?: boolean;
  directory?: boolean;
  showUploadQueue?: boolean;
  storageProvider: StorageProvider;
  mediaFolderPath: string;
  oneDriveFolder?: string;

  params?: { [key: string]: string };
  headers?: { [key: string]: string };

  allowedFileTypes?: string[];
  filter?: FilterFunction;
  name?: NameFunction;
}

export class NbFileItem {
  rawFile: File;
  name: string;
  lastModified: number;
  progress = 0;
  size: number;
  type: string;
  url: string;

  isUploading = false;
  isUploaded = false;
  isSuccess = false;
  isCancel = false;
  isError = false;

  constructor(file: File) {
    this.rawFile = file;
    this.name = file.name;
    this.lastModified = file.lastModified;
    this.size = file.size;
    this.type = file.type;
    this.url = '';
  }

  onProgress(progress: number): void {
    this.progress = Math.round(progress);
  }

  onBeforeUpload(): void {
    this.isUploading = true;
    this.isUploading = false;
    this.isCancel = false;
    this.isError = false;
    this.isSuccess = false;
    this.progress = 0;
  }

  onSuccess(): void {
    this.isUploading = false;
    this.isUploaded = true;
    this.isCancel = false;
    this.isError = false;
    this.isSuccess = true;
    this.progress = 100;
  }

  onCancel(): void {
    this.isUploading = false;
    this.isUploaded = false;
    this.isCancel = true;
    this.isError = false;
    this.isSuccess = false;
    this.progress = 0;
  }

  onError(): void {
    this.isUploading = false;
    this.isUploaded = false;
    this.isCancel = false;
    this.isError = true;
    this.isSuccess = false;
    this.progress = 0;
  }
}
