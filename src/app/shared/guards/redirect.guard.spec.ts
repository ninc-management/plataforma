import { TestBed } from '@angular/core/testing';

import { RedirectGuard } from './redirect.guard';
import { CommonTestingModule } from 'app/../common-testing.module';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('RedirectGuard', () => {
  let guard: RedirectGuard;
  const next = new ActivatedRouteSnapshot();
  const stateSpy = jasmine.createSpyObj('RouterStateSnapshot', ['toString']);
  const localWindow = {
    location: {
      href: 'http://localhost:9876/',
    },
  } as Window;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    guard = TestBed.inject(RedirectGuard);
    next.queryParams = { url: 'https://google.com' };
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('Can active return true', () => {
    guard.useWindow(localWindow);
    expect(guard.canActivate(next, stateSpy)).toBe(
      true,
      'Can activate always return true'
    );
  });

  it('Should rediret to google', () => {
    guard.useWindow(localWindow);
    guard.canActivate(next, stateSpy);
    expect(localWindow.location.href).toBe(
      'https://google.com',
      'Should be redirected to google'
    );
  });
});
