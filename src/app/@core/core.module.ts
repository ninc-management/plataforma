import {
  ModuleWithProviders,
  NgModule,
  Optional,
  SkipSelf,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbAuthModule, NbDummyAuthStrategy } from '@nebular/auth';
import { NbSecurityModule, NbRoleProvider } from '@nebular/security';
import { of as observableOf } from 'rxjs';

import { throwIfAlreadyLoaded } from './module-import-guard';
import { AnalyticsService, LayoutService, SeoService } from './utils';
import {
  CompleterService,
  LocalDataFactory,
  RemoteDataFactory,
} from 'ng2-completer';
import { UserData } from './data/users';
import { UserService } from './mock/users.service';
import { MockDataModule } from './mock/mock-data.module';
import { RoleProvider } from '../shared/providers/role.provider';

const socialLinks = [
  {
    url: 'https://github.com/akveo/nebular',
    target: '_blank',
    icon: 'github',
  },
  {
    url: 'https://www.facebook.com/akveo/',
    target: '_blank',
    icon: 'facebook',
  },
  {
    url: 'https://twitter.com/akveo_inc',
    target: '_blank',
    icon: 'twitter',
  },
];

const DATA_SERVICES = [{ provide: UserData, useClass: UserService }];

export class NbSimpleRoleProvider extends NbRoleProvider {
  getRole() {
    // here you could provide any role based on any auth flow
    return observableOf('guest');
  }
}

export const NB_CORE_PROVIDERS = [
  ...MockDataModule.forRoot().providers,
  ...DATA_SERVICES,
  ...NbAuthModule.forRoot({
    strategies: [
      NbDummyAuthStrategy.setup({
        name: 'email',
        delay: 0,
      }),
    ],
    forms: {
      login: {
        socialLinks: [],
      },
      register: {
        terms: false,
        socialLinks: [],
      },
    },
  }).providers,

  // # PAPEIS
  // Parceiro
  // Cliente
  // Associado
  // Diretor Financeiro
  // Diretor Administrativo
  // Elo Principal Nortan
  // Elo Principal para circulo
  // Assessor Executivo Remoto
  // Diretor de T.I

  // # ENQUADRAMENTO
  // Freelancer
  // Associado Trainee
  // Associado Equipe
  // Associado Líder
  // Associado Gestor
  NbSecurityModule.forRoot({
    accessControl: {
      Associado: {
        associado: '*',
      },
      'Diretor de Administração': {
        parent: 'associado',
        'elo-principal': '*',
      },
    },
  }).providers,

  {
    provide: NbRoleProvider,
    useClass: NbSimpleRoleProvider,
  },
  AnalyticsService,
  LayoutService,
  SeoService,
  CompleterService,
  LocalDataFactory,
  RemoteDataFactory,
];

@NgModule({
  imports: [CommonModule],
  exports: [NbAuthModule],
  declarations: [],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }

  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        ...NB_CORE_PROVIDERS,
        { provide: NbRoleProvider, useClass: RoleProvider },
      ],
    };
  }
}
