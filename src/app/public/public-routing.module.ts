import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxCertificateComponent } from './certificate/certificate.component';
import { NgxPublicComponent } from './public.component';

export const routes: Routes = [
  {
    path: '',
    component: NgxPublicComponent,
    children: [
      {
        path: 'accomplishments/:courseID/:participantID',
        component: NgxCertificateComponent,
      },
    ],
  },
  { path: '**', redirectTo: '/' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NgxPublicRoutingModule {}
