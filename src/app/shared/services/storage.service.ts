import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/storage';
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { from, Observable, Subject } from 'rxjs';
import { switchMap, take, filter } from 'rxjs/operators';
import { StorageProvider } from 'app/@theme/components/file-uploader/file-uploader.model';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { environment } from '../../../environments/environment';
export interface FilesUploadMetadata {
  uploadProgress$: Observable<number>;
  downloadUrl$: Observable<UploadedFile | string>;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService implements OnDestroy {
  destroy$: Subject<null> = new Subject();

  constructor(
    private readonly storage: AngularFireStorage,
    private http: HttpClient
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  uploadFileAndGetMetadata(
    mediaFolderPath: string,
    fileToUpload: File,
    fileName: string,
    provider: StorageProvider
  ): FilesUploadMetadata {
    switch (provider) {
      case StorageProvider.FIREBASE: {
        const filePath = `${mediaFolderPath}/${fileName}`;
        const uploadTask: AngularFireUploadTask = this.storage.upload(
          filePath,
          fileToUpload
        );
        return {
          downloadUrl$: this.getDownloadUrl$(uploadTask, filePath),
          uploadProgress$: uploadTask
            .percentageChanges()
            .pipe(filter((p): p is number => p != undefined)),
        };
      }
      case StorageProvider.ONEDRIVE: {
        const fileComplete$ = new Subject<number>();
        const downloadUrl$ = new Subject<UploadedFile>();
        fileComplete$.next(1);
        fileToUpload.arrayBuffer().then((f) => {
          this.http
            .put(
              environment.onedriveUri +
                mediaFolderPath +
                '/' +
                fileName +
                ':/content?@name.conflictBehavior=rename',
              f,
              { headers: { 'Content-Type': fileToUpload.type } }
            )
            .pipe(take(1))
            .subscribe((res: any) => {
              fileComplete$.next(100);
              downloadUrl$.next({
                name: res['name'],
                url: res['@microsoft.graph.downloadUrl'],
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

  private getDownloadUrl$(
    uploadTask: AngularFireUploadTask,
    path: string
  ): Observable<string> {
    return from(uploadTask).pipe(
      switchMap((_) => this.storage.ref(path).getDownloadURL())
    );
  }
}
