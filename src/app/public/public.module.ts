import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbCardModule, NbIconModule, NbLayoutModule, NbSpinnerModule } from '@nebular/theme';

import { NgxCertificateComponent } from './certificate/certificate.component';
import { ContractorEditComponent } from './contractor-edit/contractor-edit.component';
import { NgxPublicRoutingModule } from './public-routing.module';
import { NgxPublicComponent } from './public.component';
import { ContractorsModule } from 'app/pages/contractors/contractors.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NbLayoutModule,
    NbCardModule,
    NbIconModule,
    NgxPublicRoutingModule,
    ContractorsModule,
    NbSpinnerModule,
  ],
  declarations: [NgxPublicComponent, NgxCertificateComponent, ContractorEditComponent],
})
export class NgxPublicModule {}
