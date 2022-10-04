import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { from, Observable, Subject } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';

import { OneDriveService } from './onedrive.service';
import { StorageProvider } from 'app/@theme/components/file-uploader/file-uploader.model';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
export interface FilesUploadMetadata {
  uploadProgress$: Observable<number>;
  downloadUrl$: Observable<UploadedFile | string>;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService implements OnDestroy {
  destroy$: Subject<void> = new Subject();

  constructor(
    private storage: AngularFireStorage,
    private http: HttpClient,
    private onedriveService: OneDriveService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  uploadFileAndGetMetadata(
    mediaFolderPath: string,
    fileToUpload: File,
    fileName: string,
    provider: StorageProvider,
    onedriveFolder?: string
  ): FilesUploadMetadata {
    switch (provider) {
      case StorageProvider.FIREBASE: {
        const filePath = `${mediaFolderPath}/${fileName}`;
        const uploadTask: AngularFireUploadTask = this.storage.upload(filePath, fileToUpload);
        return {
          downloadUrl$: this.getDownloadUrl$(uploadTask, filePath),
          uploadProgress$: uploadTask.percentageChanges().pipe(filter((p): p is number => p != undefined)),
        };
      }
      case StorageProvider.ONEDRIVE: {
        const fileComplete$ = new Subject<number>();
        const downloadUrl$ = new Subject<UploadedFile>();
        fileComplete$.next(1);
        fileToUpload.arrayBuffer().then((f) => {
          this.http
            .put(
              this.onedriveService.oneDriveURI(onedriveFolder) +
                mediaFolderPath +
                '/' +
                fileName +
                ':/content?@name.conflictBehavior=rename',
              f,
              { headers: { 'Content-Type': fileToUpload.type } }
            )
            .pipe(take(1))
            .subscribe((res: any) => {
              this.http
                .post(this.onedriveService.createLinkURI(res['id']), { type: 'view' })
                .pipe(take(1))
                .subscribe((uploadRes: any) => {
                  fileComplete$.next(100);
                  downloadUrl$.next({
                    name: res['name'],
                    url: uploadRes['link']['webUrl'],
                  });
                });
            });
        });
        return {
          downloadUrl$: downloadUrl$.asObservable(),
          uploadProgress$: fileComplete$.asObservable(),
        };
      }
    }
  }

  private getDownloadUrl$(uploadTask: AngularFireUploadTask, path: string): Observable<string> {
    return from(uploadTask).pipe(switchMap((_) => this.storage.ref(path).getDownloadURL()));
  }
}
