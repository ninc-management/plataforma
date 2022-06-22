import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireStorage, AngularFireStorageModule } from '@angular/fire/compat/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
  MSAL_GUARD_CONFIG,
  MsalBroadcastService,
  MsalGuardConfiguration,
  MsalModule,
  MsalService,
} from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import {
  NbAuthModule,
  NbAuthService,
  NbAuthTokenParceler,
  NbDummyAuthStrategy,
  NbTokenLocalStorage,
  NbTokenService,
  NbTokenStorage,
} from '@nebular/auth';
import { NbDateFnsDateModule } from '@nebular/date-fns';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbAccessChecker, NbAclService, NbRoleProvider, NbSecurityModule } from '@nebular/security';
import {
  NbActionsModule,
  NbAlertModule,
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbContextMenuModule,
  NbDatepickerModule,
  NbDialogModule,
  NbDialogService,
  NbIconLibraries,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbListModule,
  NbMenuModule,
  NbOverlayService,
  NbProgressBarModule,
  NbRadioModule,
  NbSearchModule,
  NbSelectModule,
  NbSidebarModule,
  NbSpinnerModule,
  NbThemeModule,
  NbToastrModule,
  NbToastrService,
  NbToggleModule,
  NbTooltipModule,
  NbUserModule,
} from '@nebular/theme';
import { environment } from 'environments/environment';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { of } from 'rxjs';

import { NbCompleterModule, NbFileUploaderModule } from 'app/@theme/components';
import { routes } from 'app/app-routing.module';
import { AuthService } from 'app/auth/auth.service';
import { PagesModule } from 'app/pages/pages.module';
import { AuthGuard } from 'app/shared/guards/auth.guard';
import { RedirectGuard } from 'app/shared/guards/redirect.guard';
import { InjectorModule } from 'app/shared/injector.module';
import { ConfigService } from 'app/shared/services/config.service';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { FinancialService } from 'app/shared/services/financial.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { MetricsService } from 'app/shared/services/metrics.service';
import { OneDriveService } from 'app/shared/services/onedrive.service';
import { PromotionService } from 'app/shared/services/promotion.service';
import { StatecityService } from 'app/shared/services/statecity.service';
import { StorageService } from 'app/shared/services/storage.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { TeamService } from 'app/shared/services/team.service';
import { TransactionService } from 'app/shared/services/transaction.service';
import { UserService } from 'app/shared/services/user.service';
import { WebSocketService } from 'app/shared/services/web-socket.service';
import { SharedModule } from 'app/shared/shared.module';
import { Permissions } from 'app/shared/utils';

const roles = Object.values(Permissions);

const config: SocketIoConfig = {
  url: '',
  options: {
    path: '/api/socket.io',
    transports: ['websocket'],
  },
};

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

const socketProviders = SocketIoModule.forRoot(config).providers;
const routerProviders = RouterTestingModule.withRoutes(routes).providers;

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
    redirectUri: 'http://localhost:4200',
  },
});

const authRequest = {
  authority: 'https://login.microsoftonline.com/consumers',
  scopes: ['user.read', 'Files.Read', 'Files.Read.All', 'Files.ReadWrite', 'Files.ReadWrite.All'],
};

function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Popup,
    authRequest: authRequest,
  };
}

const IMPORTS = [
  MsalModule.forRoot(msalInstance, MSALGuardConfigFactory(), {
    interactionType: InteractionType.Popup,
    protectedResourceMap: new Map(),
  }),
  AngularFireModule.initializeApp(environment.firebaseConfig),
  BrowserAnimationsModule,
  AngularFireStorageModule,
  CommonModule,
  FormsModule,
  HttpClientTestingModule,
  InjectorModule,
  NbActionsModule,
  NbAlertModule,
  NbAuthModule,
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbCompleterModule,
  NbContextMenuModule,
  NbDateFnsDateModule.forRoot({ format: 'dd/MM/yyyy' }),
  NbDatepickerModule.forRoot(),
  NbDialogModule.forRoot(),
  NbEvaIconsModule,
  NbFileUploaderModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbListModule,
  NbMenuModule,
  NbProgressBarModule,
  NbRadioModule,
  NbSearchModule,
  NbSecurityModule,
  NbSelectModule,
  NbSidebarModule,
  NbSpinnerModule,
  NbThemeModule.forRoot(),
  NbToastrModule.forRoot(),
  NbToggleModule,
  NbTooltipModule,
  NbUserModule,
  PagesModule,
  PdfViewerModule,
  ReactiveFormsModule,
  RouterTestingModule.withRoutes(routes),
  SharedModule,
  SocketIoModule.forRoot(config),
];

const PROVIDERS = [
  ...(authProviders ? authProviders : []),
  ...(socketProviders ? socketProviders : []),
  ...(routerProviders ? routerProviders : []),
  {
    provide: MSAL_GUARD_CONFIG,
    useFactory: MSALGuardConfigFactory,
  },
  { provide: NbTokenStorage, useClass: NbTokenLocalStorage },
  {
    provide: NbRoleProvider,
    useValue: {
      getRole: () => {
        return of(roles);
      },
    },
  },
  {
    provide: NbAclService,
    useValue: {
      can: (role: any, permission: any, resource: any) => {
        return (role as string[]).includes(permission); // this is a simple mocked ACL implementation
      },
    },
  },
  AngularFireStorage,
  AuthGuard,
  AuthService,
  ConfigService,
  ContractorService,
  ContractService,
  FinancialService,
  InvoiceService,
  MetricsService,
  MsalBroadcastService,
  MsalService,
  NbAccessChecker,
  NbAuthService,
  NbAuthTokenParceler,
  NbDialogService,
  NbIconLibraries,
  NbOverlayService,
  NbToastrService,
  NbTokenService,
  OneDriveService,
  PromotionService,
  RedirectGuard,
  StatecityService,
  StorageService,
  StringUtilService,
  TeamService,
  TransactionService,
  UserService,
  WebSocketService,
  ConfigService,
];

@NgModule({
  declarations: [],
})
export class CommonTestingModule {
  public static setUpTestBed = (TestingComponent?: any) => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: IMPORTS,
        providers: PROVIDERS,
        declarations: TestingComponent ? [TestingComponent] : [],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });
    });
  };
}
