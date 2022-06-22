import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiAuthService implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const urlCheck = request.url.split('/').filter((el) => el.length > 0);
    if (urlCheck.length > 0 && urlCheck[0] == 'api')
      request = request.clone({
        headers: request.headers.set('Authorization', environment.apiToken),
      });
    return next.handle(request);
  }
}
