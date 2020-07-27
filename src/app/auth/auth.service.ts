import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  submitted$ = new BehaviorSubject<boolean>(false);

  constructor() {}
}
