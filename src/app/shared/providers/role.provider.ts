import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';

import { NbRoleProvider } from '@nebular/security';
import { UserService } from '../services/user.service';
import { filter } from 'rxjs/operators';

@Injectable()
export class RoleProvider implements NbRoleProvider {
  constructor(private userService: UserService) {}

  getRole(): Observable<string> {
    return this.userService.currentUser$.pipe(
      filter((user: 'object') => user['fullName'] != undefined),
      map((user: 'object') => {
        return user['position']?.length > 0 ? user['position'] : 'Associado';
      })
    );
  }
}
