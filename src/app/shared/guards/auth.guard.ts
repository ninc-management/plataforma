import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
  CanActivateChild,
} from '@angular/router';
import { NbAuthService } from '@nebular/auth';
import { NbAccessChecker, NbAclService } from '@nebular/security';
import { MsalService } from '@azure/msal-angular';
import { Observable } from 'rxjs';
import { map, skipWhile, switchMap, take, tap } from 'rxjs/operators';
import { ConfigService } from '../services/config.service';

let accessControl = {
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
    private authService: NbAuthService,
    private router: Router,
    private msAuthService: MsalService,
    private accessChecker: NbAccessChecker,
    private aclService: NbAclService,
    private configService: ConfigService
  ) {}

  setRouter(customRouter: Router): void {
    this.router = customRouter;
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // canActive can return Observable<boolean>, which is exactly what isAuthenticated returns
    return this.authService.isAuthenticated().pipe(
      tap((authenticated) => {
        if (!authenticated || this.msAuthService.instance.getAllAccounts().length === 0) {
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
        let obj: any = {};
        if (configs[0]) {
          configs[0].profileConfig.positions.forEach((position) => {
            if (position.permission == 'Administrador') {
              obj[position.typeName] = {
                parent: 'Diretor de T.I',
              };
            } else if (position.permission == 'Membro') {
              obj[position.typeName] = {
                parent: 'Diretor de T.I',
              };
            } else if (position.permission == 'Financeiro') {
              obj[position.typeName] = {
                parent: 'Diretor de T.I',
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
