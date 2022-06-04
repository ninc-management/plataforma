import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { StorageProvider } from 'app/@theme/components';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import { HttpTestingController } from '@angular/common/http/testing';

describe('StorageService', () => {
  let service: StorageService;
  let emptyFile: File;
  let httpMock: HttpTestingController;

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
    httpMock = TestBed.inject(HttpTestingController);
    const teamReq = httpMock.expectOne('/api/team/all');
    expect(teamReq.request.method).toBe('POST');
    teamReq.flush([]);
    const configReq = httpMock.expectOne('/api/config/all');
    const defaultConfig = {
      expenseTypes: [],
      invoiceConfig: {
        hasType: true,
        hasHeader: true,
        hasTeam: true,
        hasPreliminary: true,
        hasExecutive: true,
        hasComplementary: true,
        hasStageName: true,
        hasImportants: true,
        hasMaterialList: true,
        nfPercentage: '0,00',
        organizationPercentage: '0,00',
        codeAbbreviation: '',
      },
      profileConfig: {
        positions: [],
        hasLevels: true,
        levels: [],
        hasTeam: true,
        hasSector: true,
        hasExpertiseBySector: true,
      },
      socialConfig: {
        youtubeLink: '',
        linkedinLink: '',
        instagramLink: '',
        glassfrogLink: '',
        gathertownLink: '',
        companyName: '',
      },
      modulesConfig: {
        hasPromotion: true,
        hasCourse: true,
      },
      oneDriveConfig: {
        isActive: false,
      },
    };
    expect(configReq.request.method).toBe('POST');
    configReq.flush(defaultConfig);
    emptyFile = new File(
      [
        'Mussum Ipsum, cacilds vidis litro abertis. Mais vale um bebadis conhecidiss, que um alcoolatra anonimis. Si num tem leite então bota uma pinga aí cumpadi! Não sou faixa preta cumpadi, sou preto inteiris, inteiris. Interagi no mé, cursus quis, vehicula ac nisi.',
      ],
      'test',
      { type: 'text/txt' }
    );
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload file to firebase', (done: DoneFn) => {
    const metadata = service.uploadFileAndGetMetadata('', emptyFile, 'test', StorageProvider.FIREBASE);
    combineLatest([metadata.downloadUrl$, metadata.uploadProgress$])
      .pipe(take(1))
      .subscribe(([url, progress]) => {
        expect((url as string).split('?')[0]).toBe(
          'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/test'
        );
        expect(progress).toBe(100, 'Upload failed');
        done();
      });
  });
});
