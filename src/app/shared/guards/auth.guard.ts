import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { NbAuthService } from '@nebular/auth';
import { NbAccessChecker, NbAclService } from '@nebular/security';
import { combineLatest, Observable, of } from 'rxjs';
import { concatMap, map, skipWhile, switchMap, take, tap } from 'rxjs/operators';

import { ConfigService } from '../services/config.service';
import { AuthService } from 'app/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private nbAuthService: NbAuthService,
    private router: Router,
    private msAuthService: MsalService,
    private accessChecker: NbAccessChecker,
    private aclService: NbAclService,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // canActive can return Observable<boolean>, which is exactly what isAuthenticated returns
    const userEmail = this.authService.userEmail();
    const userActive$ = userEmail ? this.authService.isUserActive(userEmail) : of(false);
    return combineLatest([this.nbAuthService.isAuthenticated(), userActive$]).pipe(
      take(1),
      concatMap(([isAuthenticated, isUserActive]) => {
        if (!isAuthenticated || !isUserActive || this.msAuthService.instance.getAllAccounts().length === 0) {
          this.router.navigate(['auth/login'], {
            queryParams: state.root.queryParams,
            fragment: state.root.fragment ? state.root.fragment : '',
          });
          return of(false);
        } else {
          return this.authService.isCompanyLoaded$.pipe(skipWhile((isCompanyLoaded) => !isCompanyLoaded));
        }
      })
    );
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (childRoute.data?.permission == undefined) return true;
    return this.loadList().pipe(
      switchMap((obj) => {
        return this.accessChecker.isGranted(childRoute.data.permission, childRoute.data.resource).pipe(
          tap((isGranted) => {
            if (!isGranted) this.router.navigate(['/']);
          })
        );
      })
    );
  }

  loadList(): Observable<any> {
    return this.configService.getConfig().pipe(
      skipWhile((configs) => configs.length == 0),
      take(1),
      map((configs) => {
        const obj: any = {};
        if (configs[0]) {
          configs[0].profileConfig.positions.forEach((position) => {
            obj[position.roleTypeName] = Object(position.permission);
          });
        }
        return obj;
      }),
      tap((acl: any) => {
        this.aclService.setAccessControl(acl as any);
      })
    );
  }
}
