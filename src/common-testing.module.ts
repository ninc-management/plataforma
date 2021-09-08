import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbListModule,
  NbSelectModule,
  NbThemeModule,
  NbTooltipModule,
  NbToastrService,
  NbUserModule,
  NbSpinnerModule,
  NbProgressBarModule,
  NbDialogService,
  NbDialogModule,
  NbOverlayService,
  NbMenuModule,
  NbActionsModule,
  NbSearchModule,
  NbSidebarModule,
  NbContextMenuModule,
  NbRadioModule,
  NbIconLibraries,
  NbToastrModule,
  NbAutocompleteModule,
} from '@nebular/theme';
import {
  NbAuthModule,
  NbAuthService,
  NbTokenService,
  NbTokenLocalStorage,
  NbTokenStorage,
  NbAuthTokenParceler,
  NbDummyAuthStrategy,
} from '@nebular/auth';
import {
  MsalModule,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
  MsalService,
  MsalBroadcastService,
} from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { AuthService } from 'app/auth/auth.service';
import { AuthGuard } from 'app/shared/guards/auth.guard';
import { RedirectGuard } from 'app/shared/guards/redirect.guard';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { MetricsService } from 'app/shared/services/metrics.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import { PromotionService } from 'app/shared/services/promotion.service';
import { StatecityService } from 'app/shared/services/statecity.service';
import { StorageService } from 'app/shared/services/storage.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { WebSocketService } from 'app/shared/services/web-socket.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { AngularFireStorage } from '@angular/fire/storage';
import {
  NbAccessChecker,
  NbRoleProvider,
  NbAclService,
  NbSecurityModule,
} from '@nebular/security';
import { of } from 'rxjs';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { Permissions } from 'app/shared/services/utils.service';
import { NbDateFnsDateModule } from '@nebular/date-fns';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'environments/environment';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbCompleterModule, NbFileUploaderModule } from 'app/@theme/components';
import { routes } from 'app/app-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { PagesModule } from 'app/pages/pages.module';
import { CommonModule } from '@angular/common';
import { TeamService } from 'app/shared/services/team.service';

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
  scopes: [
    'user.read',
    'Files.Read',
    'Files.Read.All',
    'Files.ReadWrite',
    'Files.ReadWrite.All',
  ],
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
  CommonModule,
  FormsModule,
  HttpClientTestingModule,
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
  NbTooltipModule,
  NbToastrModule.forRoot(),
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
  ContractorService,
  ContractService,
  DepartmentService,
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
  OnedriveService,
  PromotionService,
  RedirectGuard,
  StatecityService,
  StorageService,
  StringUtilService,
  TeamService,
  UserService,
  UtilsService,
  WebSocketService,
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
