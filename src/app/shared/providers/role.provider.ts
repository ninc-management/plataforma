import { Injectable } from '@angular/core';
import { NbRoleProvider } from '@nebular/security';
import { UserService } from '../services/user.service';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { User } from '../../../../backend/src/models/user';
import { Permissions } from 'app/shared/services/utils.service';

@Injectable()
export class RoleProvider implements NbRoleProvider {
  constructor(private userService: UserService) {}

  getRole(): Observable<string | string[]> {
    return this.userService.currentUser$.pipe(
      filter((user: User) => user?.fullName != undefined),
      map((user: User): string | string[] => {
        return user.position?.length > 0
          ? user.position
          : Permissions.ASSOCIADO;
      })
    );
  }
}
