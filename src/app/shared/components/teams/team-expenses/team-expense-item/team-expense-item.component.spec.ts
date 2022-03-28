import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamExpenseItemComponent } from './team-expense-item.component';
import { CommonTestingModule } from 'app/../common-testing.module';
import { ConfigService } from 'app/shared/services/config.service';
import { of } from 'rxjs';
import { PlatformConfig } from '@models/platformConfig';
import { ExpenseType } from '@models/team';
import { cloneDeep } from 'lodash';
import { HttpTestingController } from '@angular/common/http/testing';

describe('TeamExpenseItemComponent', () => {
  let component: TeamExpenseItemComponent;
  let fixture: ComponentFixture<TeamExpenseItemComponent>;
  let configService: ConfigService;
  let httpMock: HttpTestingController;
  const configServiceSpy = jasmine.createSpyObj<ConfigService>('configService', ['getConfig', 'expenseSubTypes']);

  CommonTestingModule.setUpTestBed(TeamExpenseItemComponent);

  beforeEach(() => {
    let mockedConfigs: PlatformConfig[] = [];
    let mockedConfig = new PlatformConfig();
    let mockedExpenseType = new ExpenseType();

    mockedConfig._id = '0';
    mockedExpenseType.name = 'mockedExpenseType1';
    mockedExpenseType.subTypes.push('mockedExpenseSubType1');
    mockedExpenseType.subTypes.push('mockedExpenseSubType2');
    mockedConfig.expenseTypes.push(cloneDeep(mockedExpenseType));
    mockedConfigs.push(cloneDeep(mockedConfig));

    TestBed.overrideProvider(ConfigService, { useValue: configServiceSpy });
    configServiceSpy.getConfig.and.returnValue(of(mockedConfigs));
    configServiceSpy.expenseSubTypes.and.returnValue(mockedConfigs[0].expenseTypes.map((type) => type.name));
    configService = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(TeamExpenseItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const reqTeam = httpMock.expectOne('/api/team/all');
    expect(reqTeam.request.method).toBe('POST');
    setTimeout(() => {
      reqTeam.flush([]);
    }, 50);

    const reqUser = httpMock.expectOne('/api/user/all');
    expect(reqUser.request.method).toBe('POST');
    setTimeout(() => {
      reqUser.flush([]);
    }, 50);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
