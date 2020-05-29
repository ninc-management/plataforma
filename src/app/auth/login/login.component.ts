import { Component } from '@angular/core';
import { NbLoginComponent } from '@nebular/auth';

import * as user_validation from '../../shared/user-validation.json';

@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
})
export class NgxLoginComponent extends NbLoginComponent {
  validation = (user_validation as any).default;
}
