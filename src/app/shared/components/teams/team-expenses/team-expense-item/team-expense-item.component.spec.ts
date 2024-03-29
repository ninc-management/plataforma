import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';
import { cloneDeep } from 'lodash';

import { TeamExpenseItemComponent } from './team-expense-item.component';
import { ConfigService } from 'app/shared/services/config.service';

import { PlatformConfig } from '@models/platformConfig';
import { ExpenseType } from '@models/team';

describe('TeamExpenseItemComponent', () => {
  let component: TeamExpenseItemComponent;
  let fixture: ComponentFixture<TeamExpenseItemComponent>;
  let configService: ConfigService;
  let httpMock: HttpTestingController;

  CommonTestingModule.setUpTestBed(TeamExpenseItemComponent);

  beforeEach(() => {
    const mockedConfigs: PlatformConfig[] = [];
    const mockedConfig = new PlatformConfig();
    const mockedExpenseType = new ExpenseType();

    mockedConfig._id = '0';
    mockedExpenseType.name = 'mockedExpenseType1';
    mockedExpenseType.subTypes.push('mockedExpenseSubType1');
    mockedExpenseType.subTypes.push('mockedExpenseSubType2');
    mockedConfig.expenseConfig.adminExpenseTypes.push(cloneDeep(mockedExpenseType));
    mockedConfig.expenseConfig.contractExpenseTypes.push(cloneDeep(mockedExpenseType));
    mockedConfigs.push(cloneDeep(mockedConfig));

    configService = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(TeamExpenseItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const reqTeam = httpMock.expectOne('/api/team/all');
    expect(reqTeam.request.method).toBe('POST');
    reqTeam.flush([]);

    const reqUser = httpMock.expectOne('/api/user/all');
    expect(reqUser.request.method).toBe('POST');
    reqUser.flush([]);

    const reqConfig = httpMock.expectOne('/api/config/all');
    expect(reqConfig.request.method).toBe('POST');
    reqConfig.flush(mockedConfigs);

    const reqProvider = httpMock.expectOne('/api/provider/all');
    expect(reqProvider.request.method).toBe('POST');
    reqProvider.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
