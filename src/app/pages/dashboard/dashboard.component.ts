import { Component } from '@angular/core';
import { UtilsService } from 'app/shared/services/utils.service';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  nortanIcon = {
    icon: 'logoNoFill',
    pack: 'fac',
  };

  constructor(public utils: UtilsService) {}
}
