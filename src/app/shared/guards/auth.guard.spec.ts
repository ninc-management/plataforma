import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth.guard';
import { CommonTestingModule } from 'app/../common-testing.module';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: jasmine.SpyObj<Router>;
  const next = new ActivatedRouteSnapshot();
  const childRoute = new ActivatedRouteSnapshot();
  const stateSpy = jasmine.createSpyObj('RouterStateSnapshot', ['toString']);

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should be not athenticated and redirected to auth/login', (done: any) => {
    spyOn(router, 'navigate');
    (guard.canActivate(next, stateSpy) as Observable<boolean>).subscribe(
      (result) => {
        expect(result).toBe(false, 'user is authenticated');
        expect(router.navigate).toHaveBeenCalledWith(['auth/login']);
        done();
      }
    );
  });

  it('should allow navigate to childRoute', (done: any) => {
    childRoute.data = { permission: 'elo-principal', resource: 'test' };
    spyOn(router, 'navigate');
    (
      guard.canActivateChild(childRoute, stateSpy) as Observable<boolean>
    ).subscribe((result) => {
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should deny navigate to childRoute', (done: any) => {
    childRoute.data = { permission: 'test', resource: 'test' };
    spyOn(router, 'navigate');
    (
      guard.canActivateChild(childRoute, stateSpy) as Observable<boolean>
    ).subscribe((result) => {
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['pages/dashboard']);
      done();
    });
  });
});
