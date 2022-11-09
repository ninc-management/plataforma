import { Injectable } from '@angular/core';
import { NbRoleProvider } from '@nebular/security';
import { Observable, of } from 'rxjs';
import { map, skipWhile, take } from 'rxjs/operators';

import { UserService } from '../services/user.service';
import { AuthService } from 'app/auth/auth.service';

import { User } from '@models/user';

@Injectable()
export class RoleProvider implements NbRoleProvider {
  constructor(private userService: UserService, private authService: AuthService) {}

  getRole(): Observable<string | string[]> {
    const email = this.authService.userEmail();
    if (email) {
      return this.userService.getUser(email).pipe(
        skipWhile((user) => user === undefined),
        take(1),
        map((user: User | undefined): string | string[] => {
          if (user === undefined) return 'Associado';
          return user.position?.length > 0 ? user.position : 'Associado';
        })
      );
    } else return of([]);
  }
}
