import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { NbAuthService } from '@nebular/auth';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  currentUser: Observable<any>;
  constructor(private http: HttpClient, private authService: NbAuthService) {
    this.authService.getToken().subscribe((token) => {
      this.updateCurrentUser(token.getPayload()['email']);
    });
  }

  updateCurrentUser(userEmail: string): void {
    const body = {
      email: userEmail,
    };
    this.currentUser = this.http.post('/api/user/', body);
  }
}
