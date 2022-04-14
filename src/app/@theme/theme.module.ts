import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule, MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import {
  NbPopoverModule,
  NbActionsModule,
  NbLayoutModule,
  NbMenuModule,
  NbSearchModule,
  NbSidebarModule,
  NbUserModule,
  NbContextMenuModule,
  NbButtonModule,
  NbSelectModule,
  NbIconModule,
  NbThemeModule,
  NbTooltipModule,
  NbCardModule,
  NbInputModule,
  NbListModule,
  NbTabsetModule,
  NbToggleModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbSecurityModule } from '@nebular/security';
import { RippleService } from '../@core/utils/ripple.service';
import {
  FooterComponent,
  HeaderComponent,
  LayoutDirectionSwitcherComponent,
  SearchInputComponent,
  SwitcherComponent,
  NbCompleterModule,
  NbFileUploaderModule,
} from './components';
import { CapitalizePipe, PluralPipe, RoundPipe, TimingPipe, NumberWithCommasPipe } from './pipes';
import { OneColumnLayoutComponent, ThreeColumnsLayoutComponent, TwoColumnsLayoutComponent } from './layouts';
import { DEFAULT_THEME } from './styles/theme.default';
import { COSMIC_THEME } from './styles/theme.cosmic';
import { CORPORATE_THEME } from './styles/theme.corporate';
import { DARK_THEME } from './styles/theme.dark';
import { ConfigComponent } from './components/header/config/config.component';
import { ConfigDialogComponent } from './components/header/config/config-dialog/config-dialog.component';

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
