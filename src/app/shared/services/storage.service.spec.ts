import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { StorageProvider } from 'app/@theme/components';
import { combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';

describe('StorageService', () => {
  let service: StorageService;
  let emptyFile: File;

  CommonTestingModule.setUpTestBed();

  function myArrayBuffer(this: any) {
    // this: File or Blob
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.readAsArrayBuffer(this);
    });
  }

  beforeEach(() => {
    service = TestBed.inject(StorageService);
    emptyFile = new File(
      [
        'Mussum Ipsum, cacilds vidis litro abertis. Mais vale um bebadis conhecidiss, que um alcoolatra anonimis. Si num tem leite então bota uma pinga aí cumpadi! Não sou faixa preta cumpadi, sou preto inteiris, inteiris. Interagi no mé, cursus quis, vehicula ac nisi.',
      ],
      'test',
      { type: 'text/txt' }
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload file to firebase', (done: DoneFn) => {
    const metadata = service.uploadFileAndGetMetadata(
      '',
      emptyFile,
      'test',
      StorageProvider.FIREBASE
    );
    combineLatest(metadata.downloadUrl$, metadata.uploadProgress$)
      .toPromise()
      .then(([url, progress]) => {
        expect((url as string).split('?')[0]).toBe(
          'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/test'
        );
        expect(progress).toBe(100, 'Upload failed');
        done();
      });
  });
});
