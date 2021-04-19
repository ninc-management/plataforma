import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { ContractsComponent } from './contracts/contracts.component';
import { ContractorsComponent } from './contractors/contractors.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { UsersComponent } from './users/users.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: {
          resource: 'view-dashboard',
          permission: 'associado',
        },
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: {
          resource: 'view-profile',
          permission: 'associado',
        },
      },
      {
        path: 'invoices',
        component: InvoicesComponent,
        data: {
          resource: 'view-invoices',
          permission: 'associado',
        },
      },
      {
        path: 'contracts',
        component: ContractsComponent,
        data: {
          resource: 'view-contracts',
          permission: 'associado',
        },
      },
      {
        path: 'contractors',
        component: ContractorsComponent,
        data: {
          resource: 'view-contractors',
          permission: 'associado',
        },
      },
      {
        path: 'users',
        component: UsersComponent,
        data: {
          resource: 'view-users',
          permission: 'elo-principal',
        },
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
