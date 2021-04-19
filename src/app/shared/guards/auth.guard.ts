import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { NbAuthService } from '@nebular/auth';
import { NbAccessChecker } from '@nebular/security';
import { MsalService } from '@azure/msal-angular';
import { tap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: NbAuthService,
    private router: Router,
    private msAuthService: MsalService,
    private accessChecker: NbAccessChecker
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // canActive can return Observable<boolean>, which is exactly what isAuthenticated returns
    return this.authService.isAuthenticated().pipe(
      tap((authenticated) => {
        if (
          !authenticated ||
          this.msAuthService.instance.getAllAccounts().length === 0
        ) {
          this.router.navigate(['auth/login']);
        } else {
          this.accessChecker
            .isGranted(next.data.permission, next.data.resource)
            .pipe(take(2))
            .subscribe((isGranted) => {
              if (!isGranted) this.router.navigate(['pages/dashboard']);
            });
        }
      })
    );
  }
}
