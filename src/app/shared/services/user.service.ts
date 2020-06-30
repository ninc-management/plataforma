import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient, private router: Router) {}

  getUser(userEmail: string): Observable<any> {
    const body = {
      email: userEmail,
    };
    return this.http.post('/api/user/', body);
  }
}
