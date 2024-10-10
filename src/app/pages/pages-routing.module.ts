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
import { PERMISSIONS, RESOURCES } from 'app/shared/data-utils';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: {
          resource: RESOURCES.view_dashboard,
          permission: PERMISSIONS.dashboard,
        },
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: {
          resource: RESOURCES.view_profile,
          permission: PERMISSIONS.perfil,
        },
      },
      {
        path: 'invoices',
        component: InvoicesComponent,
        data: {
          resource: RESOURCES.view_invoices,
          permission: PERMISSIONS.orçamentos,
        },
      },
      {
        path: 'contracts',
        component: ContractsComponent,
        data: {
          resource: RESOURCES.view_contracts,
          permission: PERMISSIONS.contratos,
        },
      },
      {
        path: 'contractors',
        component: ContractorsComponent,
        data: {
          resource: RESOURCES.view_contractors,
          permission: PERMISSIONS.clientes,
        },
      },
      {
        path: 'providers',
        component: ProvidersComponent,
        data: {
          resource: RESOURCES.view_providers,
          permission: PERMISSIONS.fornecedores,
        },
      },
      {
        path: 'users',
        component: UsersComponent,
        data: {
          resource: RESOURCES.view_users,
          permission: PERMISSIONS.usuário,
        },
      },
      {
        path: 'teams',
        component: TeamsComponent,
        data: {
          resource: RESOURCES.view_teams,
          permission: PERMISSIONS.times,
        },
      },
      {
        path: 'promotions',
        component: PromotionsComponent,
        data: {
          resource: RESOURCES.view_promotions,
          permission: PERMISSIONS.promoções,
        },
      },
      {
        path: 'courses',
        component: CoursesComponent,
        data: {
          resource: RESOURCES.view_courses,
          permission: PERMISSIONS.cursos,
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
