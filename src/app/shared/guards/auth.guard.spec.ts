import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth.guard';
import { CommonTestingModule } from 'app/../common-testing.module';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, take } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { PlatformConfig, ProfileConfig } from '@models/platformConfig';
import { HttpTestingController } from '@angular/common/http/testing';
import { ExpenseType } from '@models/team';
import { cloneDeep } from 'lodash';
import { NbAccessChecker, NbAclService } from '@nebular/security';
import { NbAuthService } from '@nebular/auth';
import { MsalService } from '@azure/msal-angular';
import { IPublicClientApplication } from '@azure/msal-browser';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: jasmine.SpyObj<Router>;
  let httpMock: HttpTestingController;
  let configService: ConfigService;
  let mockedConfigs: PlatformConfig[];
  const next = new ActivatedRouteSnapshot();
  const childRoute = new ActivatedRouteSnapshot();
  const authServiceSpy = jasmine.createSpyObj<NbAuthService>('NbAuthService', ['isAuthenticated']);
  const nbAclServiceSpy = jasmine.createSpyObj<NbAclService>('NbAclService', ['setAccessControl']);
  const nbAccessCheckerSpy = jasmine.createSpyObj<NbAccessChecker>('NbAccessChecker', ['isGranted']);
  const instanceSpy = jasmine.createSpyObj<IPublicClientApplication>('IPublicClientApplication', ['getAllAccounts']);
  const msAuthServiceSpy = jasmine.createSpyObj<MsalService>('MsalService', [], {
    instance: instanceSpy,
  });

  CommonTestingModule.setUpTestBed();
  const stateSpy = jasmine.createSpyObj('RouterStateSnapshot', ['toString']);

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    TestBed.overrideProvider(NbAuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(NbAclService, { useValue: nbAclServiceSpy });
    TestBed.overrideProvider(MsalService, { useValue: msAuthServiceSpy });
    TestBed.overrideProvider(NbAccessChecker, { useValue: nbAccessCheckerSpy });
    nbAclServiceSpy.setAccessControl.and.returnValue();
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    httpMock = TestBed.inject(HttpTestingController);
    configService = TestBed.inject(ConfigService);
    mockedConfigs = [];
    let mockedConfig = new PlatformConfig();
    let mockedProfileConfig = new ProfileConfig();
    let mockedExpenseType = new ExpenseType();
    mockedConfig._id = '0';
    mockedExpenseType.name = 'mockedExpenseType1';
    mockedExpenseType.subTypes.push('mockedExpenseSubType1');
    mockedExpenseType.subTypes.push('mockedExpenseSubType2');
    mockedConfig.expenseTypes.push(cloneDeep(mockedExpenseType));
    mockedProfileConfig.positions.push(
      { roleTypeName: 'teste', permission: 'Administrador' },
      { roleTypeName: 'teste2', permission: 'Membro' },
      { roleTypeName: 'teste3', permission: 'Financeiro' }
    );
    mockedProfileConfig.levels.push('teste');
    mockedConfig.profileConfig = mockedProfileConfig;
    mockedConfigs.push(cloneDeep(mockedConfig));
    configService.getConfig().pipe(take(1)).subscribe();
    const req = httpMock.expectOne('/api/config/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedConfigs);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should be not athenticated and redirected to auth/login', (done: DoneFn) => {
    authServiceSpy.isAuthenticated.and.returnValue(of(false));
    instanceSpy.getAllAccounts.and.returnValue([]);
    spyOn(router, 'navigate');
    (guard.canActivate(next, stateSpy) as Observable<boolean>).subscribe((result) => {
      expect(result).toBe(false, 'user is authenticated');
      expect(router.navigate).toHaveBeenCalledWith(['auth/login']);
      done();
    });
  });

  it('should be athenticated and not redirected to auth/login', (done: DoneFn) => {
    authServiceSpy.isAuthenticated.and.returnValue(of(true));
    instanceSpy.getAllAccounts.and.returnValue([
      {
        homeAccountId: 'test',
        environment: 'test',
        tenantId: 'test',
        username: 'test',
        localAccountId: 'test',
      },
    ]);
    spyOn(router, 'navigate');
    (guard.canActivate(next, stateSpy) as Observable<boolean>).subscribe((result) => {
      expect(result).toBe(true, 'user is not authenticated');
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should allow navigate to childRoute', (done: DoneFn) => {
    nbAccessCheckerSpy.isGranted.and.returnValue(of(true));
    childRoute.data = { permission: 'elo-principal', resource: 'test' };
    spyOn(router, 'navigate');
    (guard.canActivateChild(childRoute, stateSpy) as Observable<boolean>).subscribe((result) => {
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should deny navigate to childRoute', (done: DoneFn) => {
    nbAccessCheckerSpy.isGranted.and.returnValue(of(false));
    childRoute.data = { permission: 'test', resource: 'test' };
    spyOn(router, 'navigate');
    (guard.canActivateChild(childRoute, stateSpy) as Observable<boolean>).subscribe((result) => {
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      done();
    });
  });

  it('loadList should work', (done: DoneFn) => {
    let accessControl = {
      teste: { parent: 'Diretor de T.I' },
      teste2: { parent: 'Associado' },
      teste3: { parent: 'Diretor Financeiro' },
    };
    guard
      .loadList()
      .pipe(take(1))
      .subscribe((obj) => {
        expect(obj).toEqual(accessControl);
        done();
      });
  });
});
