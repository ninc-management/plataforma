import { NbJSThemeOptions, DEFAULT_THEME as baseTheme } from '@nebular/theme';
import { ChartThemeFactory } from './echarts.theme';

let theme = baseTheme;
if (baseTheme.variables) {
  const baseThemeVariables = baseTheme.variables;
  const pallete = ['#37A2DA', '#9FE6B8', '#FFDB5C', '#ff9f7f', '#fb7293', '#E062AE', '#E690D1', '#e7bcf3', '#9d96f5'];
  theme = {
    name: 'default',
    base: 'default',
    variables: {
      echarts: new ChartThemeFactory(
        true,
        pallete,
        baseThemeVariables.fgText as string,
        baseThemeVariables.bg as string,
        baseThemeVariables.border4 as string,
        baseThemeVariables.layoutBg as string
      ).theme(),
    },
  } as NbJSThemeOptions;
}

export const DEFAULT_THEME = theme;
