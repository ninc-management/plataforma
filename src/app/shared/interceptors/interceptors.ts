import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiAuthService } from './api-auth.service';

export const interceptorProviders = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ApiAuthService,
    multi: true,
  },
];
