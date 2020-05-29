import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { NgxAuthRoutingModule } from './auth-routing.module';
import { NbAuthModule } from '@nebular/auth';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbDatepickerModule,
  NbSelectModule,
} from '@nebular/theme';
import { NgxAuthComponent } from './auth.component';
import { NgxLoginComponent } from './login/login.component';
import { NgxLogoutComponent } from './logout/logout.component';
import { NgxRegisterComponent } from './register/register.component';
import { BrMaskDirective } from '../shared/directives/br-mask';

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
    NgxAuthRoutingModule,

    NbAuthModule,
  ],
  declarations: [
    NgxAuthComponent,
    NgxLoginComponent,
    NgxLogoutComponent,
    NgxRegisterComponent,
    BrMaskDirective,
  ],
  exports: [BrMaskDirective],
})
export class NgxAuthModule {}
