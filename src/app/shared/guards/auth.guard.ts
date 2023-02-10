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
import { Observable } from 'rxjs';
import { map, skipWhile, switchMap, take, tap } from 'rxjs/operators';

import { ConfigService } from '../services/config.service';
import { AuthService } from 'app/auth/auth.service';
// TODO: Remove this part
const accessControl = {
  Parceiro: {
    parceiro: '*',
  },
  Parceira: {
    parent: 'Parceiro',
  },
  Cliente: {
    parent: 'Parceiro',
    cliente: '*',
  },
  Associado: {
    associado: '*',
  },
  Associada: {
    parent: 'Associado',
  },
  'Elo Principal': {
    parent: 'Associado',
    'elo-principal': '*',
  },
  'Elo Principal de Administração': {
    parent: 'Elo Principal',
  },
  'Elo Principal de Arquitetura': {
    parent: 'Elo Principal',
  },
  'Elo Principal de Projetos Complementares': {
    parent: 'Elo Principal',
  },
  'Elo Principal de Recursos Hídricos e Meio Ambiente': {
    parent: 'Elo Principal',
  },
  'Elo Principal de Engenharia Civil': {
    parent: 'Elo Principal',
  },
  'Diretor Financeiro': {
    parent: 'Elo Principal',
    df: '*',
  },
  'Diretora Financeira': {
    parent: 'Diretor Financeiro',
  },
  'Diretor Administrativo': {
    parent: 'Elo Principal',
    da: '*',
  },
  'Diretora Administrativa': {
    parent: 'Diretor Administrativo',
  },
  'Assessor Executivo Remoto': {
    parent: 'Elo Principal',
    aer: '*',
  },
  'Assessora Executiva Remota': {
    parent: 'Assessor Executivo Remoto',
  },
  'Elo Principal Nortan': {
    parent: 'Diretor Financeiro',
    'elo-nortan': '*',
  },
  'Diretor de T.I': {
    parent: 'Elo Principal Nortan',
    dti: '*',
  },
  'Diretora de T.I': {
    parent: 'Diretor de T.I',
  },
};

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
    return this.nbAuthService.isAuthenticated().pipe(
      tap((authenticated) => {
        if (
          !authenticated ||
          this.msAuthService.instance.getAllAccounts().length === 0 ||
          !this.authService.companyId
        ) {
          this.router.navigate(['auth/login']);
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
            if (position.permission == 'Administrador') {
              obj[position.roleTypeName] = {
                parent: 'Diretor de T.I',
              };
            } else if (position.permission == 'Membro') {
              obj[position.roleTypeName] = {
                parent: 'Associado',
              };
            } else if (position.permission == 'Financeiro') {
              obj[position.roleTypeName] = {
                parent: 'Diretor Financeiro',
              };
            } else if (position.permission == 'AER Natan®') {
              obj[position.roleTypeName] = {
                parent: 'Assessor Executivo Remoto',
              };
            }
          });
        }
        return obj;
      }),
      tap((obj: any) => {
        const objMerged = { ...accessControl, ...obj };
        this.aclService.setAccessControl(objMerged as any);
      })
    );
  }
}
