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
];

export const SOCIAL_ITEMS: NbMenuItem[] = [
  {
    title: 'Glassfrog',
    icon: {
      icon: 'glassfrog',
      pack: 'fac',
    },
    url: 'https://pt.glassfrog.com/people/sign_in',
    target: '_blank,',
    pathMatch: 'full',
    selected: false,
  },
  {
    title: 'Gather Town',
    icon: {
      icon: 'gtown',
      pack: 'fac',
    },
    url: 'https://gather.town/app/rAq1yeIE6vKvuc9n/Nortan%20Engenharia',
    target: '_blank,',
    pathMatch: 'full',
    selected: false,
  },
  {
    title: 'Universidade Nortan',
    icon: {
      icon: 'social-youtube',
      pack: 'ion',
    },
    url: 'https://www.youtube.com/channel/UCyHRkfO7rtMiBUCkcXw5Rcw',
    target: '_blank,',
    pathMatch: 'full',
    selected: false,
  },
  {
    title: 'Linkedin',
    icon: {
      icon: 'social-linkedin',
      pack: 'ion',
    },
    url: 'https://www.linkedin.com/company/nortan-solução-integrada-em-projetos/',
    target: '_blank,',
    pathMatch: 'full',
    selected: false,
  },
  {
    title: 'Instagram',
    icon: {
      icon: 'social-instagram',
      pack: 'ion',
    },
    url: 'https://www.instagram.com/nortanprojetos/',
    target: '_blank,',
    pathMatch: 'full',
    selected: false,
  },
];
