import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Company } from '@models/company';
import { AuthService } from 'app/auth/auth.service';
import { CommonTestingModule } from 'common-testing.module';
import { Subject, take } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';
import MockedServerSocket from 'socket.io-mock';

import { CompanyService } from './company.service';
import { WebSocketService } from './web-socket.service';
import { UploadedFile } from '@models/shared';
import { cloneDeep } from 'lodash';
import { reviveDates } from '../utils';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;
  let mockedCompanies: Company[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);
  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedCompanies: Company[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getCompanies()
        .pipe(take(2))
        .subscribe((companies: Company[]) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(companies.length).toBe(0);
              break;
            }
            case 2: {
              const expectedCompanies = mockedCompanies;
              expect(companies.length).toBe(2);
              expect(companies).toEqual(expectedCompanies);
              test(expectedCompanies);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/company/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedCompanies);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CompanyService);
    mockedCompanies = [];
    let tmpCompany = new Company();
    tmpCompany._id = '0';
    tmpCompany.address = 'rua teste 0';
    tmpCompany.cnpj = '03.778.130/0001-48';
    tmpCompany.companyName = 'Teste';
    tmpCompany.youtubeLink = 'youtubeTeste';
    tmpCompany.glassfrogLink = 'glassTeste';
    tmpCompany.gathertownLink = 'gathertownTeste';
    tmpCompany.instagramLink = 'instagramTeste';
    tmpCompany.linkedinLink = 'linkedinLinkTeste';
    tmpCompany.logoDefault = new UploadedFile();
    tmpCompany.logoDefault.name = 'logoTeste';
    tmpCompany.logoDefault.url = 'logoDefaultURl';
    tmpCompany.logoWhite = new UploadedFile();
    tmpCompany.logoWhite.name = 'logoWhite';
    tmpCompany.logoWhite.url = 'logoWhiteURL';
    tmpCompany.logoWhiteWithoutName = new UploadedFile();
    tmpCompany.logoWhiteWithoutName.name = 'logoWhiteWithoutNameURL';
    tmpCompany.logoWhiteWithoutName.url = 'logoWhiteWithoutNameURL';
    tmpCompany.logoWithoutName = new UploadedFile();
    tmpCompany.logoWithoutName.name = 'logoWithoutName';
    tmpCompany.logoWithoutName.url = 'logoWithoutName';
    tmpCompany.qrcodeURL = 'qrcodeURL';
    mockedCompanies.push(cloneDeep(tmpCompany));
    tmpCompany = new Company();
    tmpCompany._id = '1';
    tmpCompany.address = 'rua teste 1';
    tmpCompany.cnpj = '03.778.130/0001-48';
    tmpCompany.companyName = 'Teste';
    tmpCompany.youtubeLink = 'youtubeTeste';
    tmpCompany.glassfrogLink = 'glassTeste';
    tmpCompany.gathertownLink = 'gathertownTeste';
    tmpCompany.instagramLink = 'instagramTeste';
    tmpCompany.linkedinLink = 'linkedinLinkTeste';
    tmpCompany.logoDefault = new UploadedFile();
    tmpCompany.logoDefault.name = 'logoTeste';
    tmpCompany.logoDefault.url = 'logoDefaultURl';
    tmpCompany.logoWhite = new UploadedFile();
    tmpCompany.logoWhite.name = 'logoWhite';
    tmpCompany.logoWhite.url = 'logoWhiteURL';
    tmpCompany.logoWhiteWithoutName = new UploadedFile();
    tmpCompany.logoWhiteWithoutName.name = 'logoWhiteWithoutNameURL';
    tmpCompany.logoWhiteWithoutName.url = 'logoWhiteWithoutNameURL';
    tmpCompany.logoWithoutName = new UploadedFile();
    tmpCompany.logoWithoutName.name = 'logoWithoutName';
    tmpCompany.logoWithoutName.url = 'logoWithoutName';
    tmpCompany.qrcodeURL = 'qrcodeURL';
    mockedCompanies.push(cloneDeep(tmpCompany));
    mockedCompanies = reviveDates(mockedCompanies);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveCompany should work', (done: DoneFn) => {
    const tmpCompany = new Company();
    tmpCompany._id = '2';
    tmpCompany.address = 'rua teste 2';
    tmpCompany.cnpj = '03.778.130/0001-48';
    tmpCompany.companyName = 'Teste';
    tmpCompany.youtubeLink = 'youtubeTeste';
    tmpCompany.glassfrogLink = 'glassTeste';
    tmpCompany.gathertownLink = 'gathertownTeste';
    tmpCompany.instagramLink = 'instagramTeste';
    tmpCompany.linkedinLink = 'linkedinLinkTeste';
    tmpCompany.logoDefault = new UploadedFile();
    tmpCompany.logoDefault.name = 'logoTeste';
    tmpCompany.logoDefault.url = 'logoDefaultURl';
    tmpCompany.logoWhite = new UploadedFile();
    tmpCompany.logoWhite.name = 'logoWhite';
    tmpCompany.logoWhite.url = 'logoWhiteURL';
    tmpCompany.logoWhiteWithoutName = new UploadedFile();
    tmpCompany.logoWhiteWithoutName.name = 'logoWhiteWithoutNameURL';
    tmpCompany.logoWhiteWithoutName.url = 'logoWhiteWithoutNameURL';
    tmpCompany.logoWithoutName = new UploadedFile();
    tmpCompany.logoWithoutName.name = 'logoWithoutName';
    tmpCompany.logoWithoutName.url = 'logoWithoutName';
    tmpCompany.qrcodeURL = 'qrcodeURL';

    let i = 1;
    const data = {
      ns: {
        coll: 'companies',
      },
      operationType: 'insert',
      fullDocument: tmpCompany,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));
    service
      .getCompanies()
      .pipe(take(3))
      .subscribe((companies: Company[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(companies.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(companies.length).toBe(2);
            expect(companies).toEqual(reviveDates(mockedCompanies));
            service.saveCompany(tmpCompany);
            const req1 = httpMock.expectOne('/api/company/');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(companies.length).toBe(3);
            mockedCompanies.push(tmpCompany);
            expect(companies).toEqual(reviveDates(mockedCompanies));
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    // mock response
    const req = httpMock.expectOne('/api/company/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedCompanies);
    }, 50);
  });

  it('editCompany should work', (done: DoneFn) => {
    const tmpCompany = cloneDeep(mockedCompanies[1]);
    let i = 1;
    const data = {
      ns: {
        coll: 'companies',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { companyName: 'Empresa NINC' },
        removedFields: [] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));
    service
      .getCompanies()
      .pipe(take(3))
      .subscribe((companies: Company[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(companies.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(companies.length).toBe(2);
            expect(companies).toEqual(mockedCompanies);
            service.editCompany(tmpCompany);
            const req1 = httpMock.expectOne('/api/company/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(companies.length).toBe(2);
            expect(companies[1].companyName).toBe('Empresa NINC');
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    // mock response
    const req = httpMock.expectOne('/api/company/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedCompanies);
    }, 50);
  });

  baseTest('getCompany should work', (expectedCompanies: Company[]) => {});

  baseTest('idToCompany should work', (expectedCompanies: Company[]) => {
    expect(service.idToCompany('0')).toEqual(expectedCompanies[0]);
    expect(service.idToCompany('1')).toEqual(expectedCompanies[1]);
    expect(service.idToCompany(reviveDates(mockedCompanies[0]))).toEqual(expectedCompanies[0]);
    expect(service.idToCompany(reviveDates(mockedCompanies[1]))).toEqual(expectedCompanies[1]);
  });
});
