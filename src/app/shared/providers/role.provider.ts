import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';

import { NbRoleProvider } from '@nebular/security';
import { UserService } from '../services/user.service';

@Injectable()
export class RoleProvider implements NbRoleProvider {
  constructor(private userService: UserService) {}

  getRole(): Observable<string> {
    return this.userService.currentUser$.pipe(
      map((user: 'object') => {
        return user['role'] ? user['role'] : 'user'; //TODO: Remover fallback para user
      })
    );
  }
}
