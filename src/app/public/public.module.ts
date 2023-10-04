import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbCardModule, NbIconModule, NbLayoutModule } from '@nebular/theme';

import { NgxCertificateComponent } from './certificate/certificate.component';
import { ContractorEditComponent } from './contractor-edit/contractor-edit.component';
import { NgxPublicRoutingModule } from './public-routing.module';
import { NgxPublicComponent } from './public.component';

@NgModule({
  imports: [CommonModule, RouterModule, NbLayoutModule, NbCardModule, NbIconModule, NgxPublicRoutingModule],
  declarations: [NgxPublicComponent, NgxCertificateComponent, ContractorEditComponent],
})
export class NgxPublicModule {}
