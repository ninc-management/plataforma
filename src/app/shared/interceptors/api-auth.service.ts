import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

import { AuthService } from 'app/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApiAuthService implements HttpInterceptor {
  constructor(public authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const urlCheck = request.url.split('/').filter((el) => el.length > 0);

    if (urlCheck.length > 0 && urlCheck[0] == 'api' && urlCheck[1] != 'auth') {
      request = request.clone({
        headers: request.headers
          .set('Authorization', environment.apiToken)
          .set(
            'CompanyId',
            this.authService.isLoggedIn$.getValue() && this.authService.companyId ? this.authService.companyId : ''
          ),
      });
    }

    return next.handle(request);
  }
}
