import { Injectable } from '@angular/core';
import { NbRoleProvider } from '@nebular/security';
import { UserService } from '../services/user.service';
import { Observable, of } from 'rxjs';
import { map, skipWhile, take } from 'rxjs/operators';
import { User } from '@models/user';
import { AuthService } from 'app/auth/auth.service';
import { Permissions } from '../utils';

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
          if (user === undefined) return Permissions.ASSOCIADO;
          return user.position?.length > 0 ? user.position : Permissions.ASSOCIADO;
        })
      );
    } else return of([]);
  }
}
