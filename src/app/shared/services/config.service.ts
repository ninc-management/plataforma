import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';

import { handle } from '../utils';
import { CompanyService } from './company.service';
import { WebSocketService } from './web-socket.service';

import { ColorShades, Company } from '@models/company';
import { PlatformConfig } from '@models/platformConfig';

export enum EXPENSE_TYPES {
  APORTE = 'Aporte',
  COMISSAO = 'Comissão',
}

export enum EXPENSE_OBJECT_TYPES {
  CONTRACT = 'contract',
  TEAM = 'team',
}

export enum COLOR_TYPES {
  PRIMARY = 'primary',
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
}

export interface Colors {
  primary: string[];
  success: string[];
  warning: string[];
  info: string[];
  danger: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private config$ = new BehaviorSubject<PlatformConfig[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private wsService: WebSocketService, private companyService: CompanyService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveConfig(config: PlatformConfig): void {
    const req = {
      config: config,
    };
    this.http.post('/api/config/', req).pipe(take(1)).subscribe();
  }

  //INVARIANT: There's only one PlatformConfig object in the collection
  getConfig(): Observable<PlatformConfig[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/config/all', {})
        .pipe(take(1))
        .subscribe((configs: any) => {
          this.config$.next(configs as PlatformConfig[]);
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.config$, 'platformconfigs'));
    }
    return this.config$;
  }

  editConfig(config: PlatformConfig): void {
    const req = {
      config: config,
    };
    this.http.post('/api/config/update', req).pipe(take(1)).subscribe();
  }

  expenseSubTypes(type: string, objectType: EXPENSE_OBJECT_TYPES = EXPENSE_OBJECT_TYPES.TEAM): string[] {
    if (!type) return [];
    let tmpType;
    if (objectType == EXPENSE_OBJECT_TYPES.TEAM)
      tmpType = this.config$.value[0].expenseConfig.adminExpenseTypes.find((eType) => eType.name === type);
    else tmpType = this.config$.value[0].expenseConfig.contractExpenseTypes.find((eType) => eType.name === type);

    return tmpType ? tmpType.subTypes : [];
  }

  sendEvaColorsRequest(primaryColor: string): Observable<Colors> {
    const url = '/api/config/colors';
    const body = {
      // slice(1) is necessary to remove the # from HEX
      // #FFFFF -> FFFFF
      primaryColorHex: primaryColor.slice(1),
    };

    return this.http.post<Colors>(url, body).pipe(take(1));
  }

  applyCustomColors(config: PlatformConfig): void {
    if (!config.company) return;
    const company = this.companyService.idToCompany(config.company);
    if (!this.hasCustomColor(company)) return;

    let bodyStyleAttribute = '';

    bodyStyleAttribute += this.getCSSValuesByColorType(COLOR_TYPES.PRIMARY, company.colors.primary);
    bodyStyleAttribute += this.getCSSValuesByColorType(COLOR_TYPES.SUCCESS, company.colors.success);
    bodyStyleAttribute += this.getCSSValuesByColorType(COLOR_TYPES.INFO, company.colors.info);
    bodyStyleAttribute += this.getCSSValuesByColorType(COLOR_TYPES.DANGER, company.colors.danger);
    bodyStyleAttribute += this.getCSSValuesByColorType(COLOR_TYPES.WARNING, company.colors.warning);

    (document.body as any).setAttribute('style', bodyStyleAttribute);
  }

  private getCSSValuesByColorType(colorType: string, colorShades: ColorShades): string {
    let cssValuesString = '';

    cssValuesString += '--color-' + colorType + '-100: ' + colorShades.color100 + ';';
    cssValuesString += '--color-' + colorType + '-200: ' + colorShades.color200 + ';';
    cssValuesString += '--color-' + colorType + '-300: ' + colorShades.color300 + ';';
    cssValuesString += '--color-' + colorType + '-400: ' + colorShades.color400 + ';';
    cssValuesString += '--color-' + colorType + '-500: ' + colorShades.color500 + ';';
    cssValuesString += '--color-' + colorType + '-600: ' + colorShades.color600 + ';';
    cssValuesString += '--color-' + colorType + '-700: ' + colorShades.color700 + ';';
    cssValuesString += '--color-' + colorType + '-800: ' + colorShades.color800 + ';';
    cssValuesString += '--color-' + colorType + '-900: ' + colorShades.color900 + '; ';

    return cssValuesString;
  }

  //If the primary shades are saved, then all other colors shades are saved too
  private hasCustomColor(company: Company): boolean {
    return (
      company.colors.primary.color100 != '' &&
      company.colors.primary.color200 != '' &&
      company.colors.primary.color300 != '' &&
      company.colors.primary.color400 != '' &&
      company.colors.primary.color500 != '' &&
      company.colors.primary.color600 != '' &&
      company.colors.primary.color700 != '' &&
      company.colors.primary.color800 != '' &&
      company.colors.primary.color900 != ''
    );
  }
}
