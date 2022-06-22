import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { NbAuthModule, NbDummyAuthStrategy } from '@nebular/auth';
import { NbRoleProvider, NbSecurityModule } from '@nebular/security';
import { of as observableOf } from 'rxjs';

import { RoleProvider } from '../shared/providers/role.provider';
import { throwIfAlreadyLoaded } from './module-import-guard';
import { AnalyticsService, LayoutService, SeoService } from './utils';

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

export class NbSimpleRoleProvider extends NbRoleProvider {
  getRole() {
    // here you could provide any role based on any auth flow
    return observableOf('guest');
  }
}

const authProviders = NbAuthModule.forRoot({
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
}).providers;

const securityProviders = NbSecurityModule.forRoot({}).providers;

export const NB_CORE_PROVIDERS = [
  ...(authProviders ? authProviders : []),
  ...(securityProviders ? securityProviders : []),
  {
    provide: NbRoleProvider,
    useClass: NbSimpleRoleProvider,
  },
  AnalyticsService,
  LayoutService,
  SeoService,
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
      providers: [...NB_CORE_PROVIDERS, { provide: NbRoleProvider, useClass: RoleProvider }],
    };
  }
}
