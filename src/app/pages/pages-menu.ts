import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Início',
    icon: {
      icon: 'home',
      pack: 'fa',
    },
    link: '/pages/dashboard',
    pathMatch: 'full',
    home: true,
  },
  {
    title: 'Orçamentos',
    icon: {
      icon: 'file-invoice-dollar',
      pack: 'fa',
    },
    link: '/pages/invoices',
    pathMatch: 'full',
  },
  {
    title: 'Contratos',
    icon: {
      icon: 'file-alt',
      pack: 'fa',
    },
    link: '/pages/contracts',
    pathMatch: 'full',
  },
];
