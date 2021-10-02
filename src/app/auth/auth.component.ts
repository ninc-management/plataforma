import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { NbAuthComponent, NbAuthService } from '@nebular/auth';
import { AuthService } from './auth.service';

@Component({
  selector: 'ngx-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class NgxAuthComponent extends NbAuthComponent {
  constructor(protected auth: NbAuthService, protected location: Location, public authService: AuthService) {
    super(auth, location);
  }
}
