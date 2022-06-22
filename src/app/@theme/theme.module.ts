import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_RIPPLE_GLOBAL_OPTIONS, MatRippleModule } from '@angular/material/core';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbSecurityModule } from '@nebular/security';
import {
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbContextMenuModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbLayoutModule,
  NbListModule,
  NbMenuModule,
  NbPopoverModule,
  NbSearchModule,
  NbSelectModule,
  NbSidebarModule,
  NbTabsetModule,
  NbThemeModule,
  NbToggleModule,
  NbTooltipModule,
  NbUserModule,
} from '@nebular/theme';

import { RippleService } from '../@core/utils/ripple.service';
import { SharedModule } from '../shared/shared.module';
import {
  FooterComponent,
  HeaderComponent,
  LayoutDirectionSwitcherComponent,
  NbCompleterModule,
  NbFileUploaderModule,
  SearchInputComponent,
  SwitcherComponent,
} from './components';
import { ConfigDialogComponent } from './components/header/config/config-dialog/config-dialog.component';
import { ConfigComponent } from './components/header/config/config.component';
import { OneColumnLayoutComponent, ThreeColumnsLayoutComponent, TwoColumnsLayoutComponent } from './layouts';
import { CapitalizePipe, NumberWithCommasPipe, PluralPipe, RoundPipe, TimingPipe } from './pipes';
import { CORPORATE_THEME } from './styles/theme.corporate';
import { COSMIC_THEME } from './styles/theme.cosmic';
import { DARK_THEME } from './styles/theme.dark';
import { DEFAULT_THEME } from './styles/theme.default';

const NB_MODULES = [
  NbLayoutModule,
  NbMenuModule,
  NbUserModule,
  NbPopoverModule,
  NbActionsModule,
  NbSearchModule,
  NbSidebarModule,
  NbContextMenuModule,
  NbSecurityModule,
  NbButtonModule,
  NbSelectModule,
  NbIconModule,
  NbEvaIconsModule,
  NbCompleterModule,
  NbFileUploaderModule,
  NbTooltipModule,
  NbCardModule,
  FormsModule,
  NbInputModule,
  NbListModule,
  NbTabsetModule,
  NbToggleModule,
  NbFormFieldModule,
];
const COMPONENTS = [
  SwitcherComponent,
  LayoutDirectionSwitcherComponent,
  HeaderComponent,
  FooterComponent,
  SearchInputComponent,
  OneColumnLayoutComponent,
  ThreeColumnsLayoutComponent,
  TwoColumnsLayoutComponent,
  ConfigComponent,
  ConfigDialogComponent,
];
const PIPES = [CapitalizePipe, PluralPipe, RoundPipe, TimingPipe, NumberWithCommasPipe];

const themeProviders = NbThemeModule.forRoot(
  {
    name: 'default',
  },
  [DEFAULT_THEME, COSMIC_THEME, CORPORATE_THEME, DARK_THEME]
).providers;

@NgModule({
  imports: [CommonModule, MatRippleModule, SharedModule, ...NB_MODULES],
  exports: [CommonModule, NbCompleterModule, ...PIPES, ...COMPONENTS],
  declarations: [...COMPONENTS, ...PIPES],
  providers: [{ provide: MAT_RIPPLE_GLOBAL_OPTIONS, useExisting: RippleService }],
})
export class ThemeModule {
  static forRoot(): ModuleWithProviders<ThemeModule> {
    return {
      ngModule: ThemeModule,
      providers: [...(themeProviders ? themeProviders : [])],
    };
  }
}
