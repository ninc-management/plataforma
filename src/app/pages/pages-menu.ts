import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Início',
    icon: 'home-outline',
    link: '/pages/dashboard',
    pathMatch: 'full',
    home: true,
  },
  {
    title: 'Contratos',
    icon: 'file-text-outline',
    link: '/pages/contracts',
    pathMatch: 'full',
  },
];
