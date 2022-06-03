import { TestBed } from '@angular/core/testing';

import { MetricsService } from './metrics.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { HttpTestingController } from '@angular/common/http/testing';

describe('MetricsService', () => {
  let service: MetricsService;
  let httpMock: HttpTestingController;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(MetricsService);
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
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
