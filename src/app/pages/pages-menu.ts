import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Início',
    icon: {
      icon: 'home',
      pack: 'fac',
    },
    link: '/pages/dashboard',
    pathMatch: 'full',
    home: true,
  },
  {
    title: 'Orçamentos',
    icon: {
      icon: 'file-invoice-dollar',
      pack: 'fac',
    },
    link: '/pages/invoices',
    pathMatch: 'full',
  },
  {
    title: 'Contratos',
    icon: {
      icon: 'file-invoice',
      pack: 'fac',
    },
    link: '/pages/contracts',
    pathMatch: 'full',
  },
  {
    title: 'Clientes',
    icon: {
      icon: 'clients',
      pack: 'fac',
    },
    link: '/pages/contractors',
    pathMatch: 'full',
  },
  {
    title: 'Fornecedores',
    icon: {
      icon: 'address-book',
      pack: 'far',
    },
    link: '/pages/providers',
    pathMatch: 'full',
  },
];
