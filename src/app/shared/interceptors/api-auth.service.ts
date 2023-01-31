import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, take } from 'rxjs';

import { conns } from '../../../../backend/src/shared/global';
import { CompanyService } from '../services/company.service';
import { UserService } from '../services/user.service';

import { Company } from '@models/company';
import { User } from '@models/user';

@Injectable({
  providedIn: 'root',
})
export class ApiAuthService implements HttpInterceptor {
  currentUser = new User();
  company = new Company();
  constructor(public userService: UserService, public companyService: CompanyService) {
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.currentUser = user;
    });
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const urlCheck = request.url.split('/').filter((el) => el.length > 0);
    if (this.currentUser.company !== undefined)
      this.company = this.companyService.idToCompany(this.currentUser.company);
    if (urlCheck.length > 0 && urlCheck[0] == 'api' && urlCheck[1] != 'auth') {
      request = request.clone({
        headers: request.headers.set('Authorization', environment.apiToken).set('CompanyId', this.company._id),
      });
    }

    return next.handle(request);
  }
}
