import { Injectable } from '@angular/core';
import { NbRoleProvider } from '@nebular/security';
import { UserService } from '../services/user.service';
import { Observable, of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { User } from '@models/user';
import { Permissions } from 'app/shared/services/utils.service';
import { AuthService } from 'app/auth/auth.service';

@Injectable()
export class RoleProvider implements NbRoleProvider {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  getRole(): Observable<string | string[]> {
    const email = this.authService.userEmail();
    if (email) {
      return this.userService.getUser(email).pipe(
        take(2),
        filter((user): user is User => user !== undefined),
        map((user: User): string | string[] => {
          return user.position?.length > 0
            ? user.position
            : Permissions.ASSOCIADO;
        })
      );
    } else return of([]);
  }
}
