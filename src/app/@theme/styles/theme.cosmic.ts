import { NbJSThemeOptions, COSMIC_THEME as baseTheme } from '@nebular/theme';
import { ChartThemeFactory } from './echarts.theme';

let theme = baseTheme;
if (baseTheme.variables) {
  const baseThemeVariables = baseTheme.variables;
  const pallete = ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9', '#05c091', '#ff8a45', '#8d48e3', '#dd79ff'];
  theme = {
    name: 'cosmic',
    base: 'cosmic',
    variables: {
      echarts: new ChartThemeFactory(
        true,
        pallete,
        baseThemeVariables.fgText as string,
        baseThemeVariables.bg as string,
        baseThemeVariables.fg as string,
        baseThemeVariables.layoutBg as string
      ).theme(),
    },
  } as NbJSThemeOptions;
}

export const COSMIC_THEME = theme;
