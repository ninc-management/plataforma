import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { ApiAuthService } from './api-auth.service';
import { ResponseNotifierService } from './response-notifier.service';

export const interceptorProviders = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ApiAuthService,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ResponseNotifierService,
    multi: true,
  },
];
