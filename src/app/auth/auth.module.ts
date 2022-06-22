import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NbAuthModule } from '@nebular/auth';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbSelectModule,
  NbTooltipModule,
} from '@nebular/theme';

import { SharedModule } from '../shared/shared.module';
import { NgxAuthRoutingModule } from './auth-routing.module';
import { NgxAuthComponent } from './auth.component';
import { NgxLoginComponent } from './login/login.component';
import { NgxLogoutComponent } from './logout/logout.component';
import { NgxRegisterComponent } from './register/register.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NbAlertModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    NbDatepickerModule,
    NbSelectModule,
    NbLayoutModule,
    NbCardModule,
    NbIconModule,
    NbTooltipModule,
    NgxAuthRoutingModule,
    SharedModule,
    NbAuthModule,
  ],
  declarations: [NgxAuthComponent, NgxLoginComponent, NgxLogoutComponent, NgxRegisterComponent],
})
export class NgxAuthModule {}
