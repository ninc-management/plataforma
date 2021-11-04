import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgxPublicRoutingModule } from './public-routing.module';
import { NgxPublicComponent } from './public.component';
import { NgxCertificateComponent } from './certificate/certificate.component';
import { NbCardModule, NbIconModule, NbLayoutModule } from '@nebular/theme';

@NgModule({
  imports: [CommonModule, RouterModule, NbLayoutModule, NbCardModule, NbIconModule, NgxPublicRoutingModule],
  declarations: [NgxPublicComponent, NgxCertificateComponent],
})
export class NgxPublicModule {}
