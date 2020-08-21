import { Component } from '@angular/core';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  constructor(public userService: UserService) {}
}
