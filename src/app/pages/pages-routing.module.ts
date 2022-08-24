import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContractorsComponent } from './contractors/contractors.component';
import { ContractsComponent } from './contracts/contracts.component';
import { CoursesComponent } from './courses/courses.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { PagesComponent } from './pages.component';
import { ProfileComponent } from './profile/profile.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { ProvidersComponent } from './providers/providers.component';
import { TeamsComponent } from './teams/teams.component';
import { UsersComponent } from './users/users.component';
import { Permissions } from 'app/shared/utils';

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
          permission: Permissions.ASSOCIADO,
        },
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: {
          resource: 'view-profile',
          permission: Permissions.ASSOCIADO,
        },
      },
      {
        path: 'invoices',
        component: InvoicesComponent,
        data: {
          resource: 'view-invoices',
          permission: Permissions.ASSOCIADO,
        },
      },
      {
        path: 'contracts',
        component: ContractsComponent,
        data: {
          resource: 'view-contracts',
          permission: Permissions.ASSOCIADO,
        },
      },
      {
        path: 'contractors',
        component: ContractorsComponent,
        data: {
          resource: 'view-contractors',
          permission: Permissions.ASSOCIADO,
        },
      },
      {
        path: 'providers',
        component: ProvidersComponent,
        data: {
          resource: 'view-providers',
          permission: Permissions.ASSOCIADO,
        },
      },
      {
        path: 'users',
        component: UsersComponent,
        data: {
          resource: 'view-users',
          permission: Permissions.ELO_PRINCIPAL,
        },
      },
      {
        path: 'teams',
        component: TeamsComponent,
        data: {
          resource: 'view-teams',
          permission: Permissions.ELO_PRINCIPAL,
        },
      },
      {
        path: 'promotions',
        component: PromotionsComponent,
        data: {
          resource: 'view-promotions',
          permission: Permissions.ELO_PRINCIPAL,
        },
      },
      {
        path: 'courses',
        component: CoursesComponent,
        data: {
          resource: 'view-courses',
          permission: Permissions.ELO_PRINCIPAL,
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
