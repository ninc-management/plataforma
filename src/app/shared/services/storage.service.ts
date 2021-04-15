import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/storage';
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { from, Observable, Subject } from 'rxjs';
import { takeUntil, switchMap, take } from 'rxjs/operators';
import { UserService } from './user.service';
import { StorageProvider } from '../../@theme/components/file-uploader/file-uploader.model';
import { environment } from '../../../environments/environment';
import { UploadedFile } from '../../@theme/components/file-uploader/file-uploader.service';

export interface FilesUploadMetadata {
  uploadProgress$: Observable<number>;
  downloadUrl$: Observable<UploadedFile | string>;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService implements OnDestroy {
  currentUser = {};
  destroy$: Subject<null> = new Subject();

  constructor(
    private readonly storage: AngularFireStorage,
    private http: HttpClient,
    private userService: UserService
  ) {
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => (this.currentUser = user));
  }

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
        const filePath = `${mediaFolderPath}/${this.currentUser['_id']}`;
        const uploadTask: AngularFireUploadTask = this.storage.upload(
          filePath,
          fileToUpload
        );
        return {
          downloadUrl$: this.getDownloadUrl$(uploadTask, filePath),
          uploadProgress$: uploadTask.percentageChanges(),
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
            .subscribe((res) => {
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
