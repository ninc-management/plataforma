import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { BrowserUtils } from '@azure/msal-browser';

import { AuthGuard } from './shared/guards/auth.guard';
import { RedirectGuard } from './shared/guards/redirect.guard';

export const routes: Routes = [
  {
    path: 'public',
    loadChildren: () => import('./public/public.module').then((m) => m.NgxPublicModule),
  },
  {
    path: 'pages',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./pages/pages.module').then((m) => m.PagesModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.NgxAuthModule),
  },
  {
    path: 'externalRedirect',
    canActivate: [RedirectGuard],
    component: RedirectGuard,
  },
  { path: '', redirectTo: 'pages', pathMatch: 'full' },
  { path: '**', redirectTo: 'pages' },
];

const config: ExtraOptions = {
  useHash: false,
  // Don't perform initial navigation in iframes or popups
  initialNavigation: !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup() ? 'enabledNonBlocking' : 'disabled', // Set to enabledBlocking to use Angular Universal
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
