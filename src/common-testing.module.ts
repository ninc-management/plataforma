import {
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
} from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
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
  NbUserModule,
} from '@nebular/theme';
import { Ng2CompleterModule } from 'ng2-completer';
import { NbAuthModule } from '@nebular/auth';
import {
  MsalModule,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
  MsalService,
} from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { MSALGuardConfigFactory } from 'app/app.module';

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
    redirectUri: 'http://localhost:4200',
  },
});

const IMPORTS = [
  MsalModule.forRoot(msalInstance, MSALGuardConfigFactory(), {
    interactionType: InteractionType.Popup,
    protectedResourceMap: new Map(),
  }),
  NbThemeModule.forRoot(),
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  HttpClientTestingModule,
  RouterTestingModule,
  NbAlertModule,
  NbAuthModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbListModule,
  NbSelectModule,
  NbTooltipModule,
  NbUserModule,
  Ng2CompleterModule,
];

const PROVIDERS = [
  DatePipe,
  MsalService,
  {
    provide: MSAL_GUARD_CONFIG,
    useFactory: MSALGuardConfigFactory,
  },
];

@NgModule({
  declarations: [],
})
export class CommonTestingModule {
  public static setUpTestBed = (TestingComponent: any) => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: IMPORTS,
        providers: PROVIDERS,
        declarations: [TestingComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });
    });
  };

  public static setUpTestBedService = (TestingService: any) => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: IMPORTS,
        providers: [TestingService, ...PROVIDERS],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });
    });
  };
}
