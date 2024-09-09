import { Company } from '@models/company';

const emptyColorShades = {
  color100: '',
  color200: '',
  color300: '',
  color400: '',
  color500: '',
  color600: '',
  color700: '',
  color800: '',
  color900: '',
};

export const externalMockedCompanies: Company[] = [
  {
    _id: '0',
    showCompanyName: true,
    announcement: 'test',
    address: 'rua teste 0',
    cnpj: '03.778.130/0001-48',
    companyName: 'Teste 1',
    uri: 'plataforma-nortan.ag37e.mongodb.net/teste',
    contractsMeta: 8000,
    taxesMeta: 5000,
    oeMeta: 3000,
    youtubeLink: 'youtubeTeste',
    glassfrogLink: 'glassTeste',
    gathertownLink: 'gathertownTeste',
    instagramLink: 'instagramTeste',
    linkedinLink: 'linkedinLinkTeste',
    logoDefault: {
      url: '',
      name: '',
    },
    logoWithoutName: {
      url: '',
      name: '',
    },
    logoWhite: {
      url: '',
      name: '',
    },
    logoWhiteWithoutName: {
      url: '',
      name: '',
    },
    logoSupport: {
      url: '',
      name: '',
    },
    colors: {
      primary: emptyColorShades,
      success: emptyColorShades,
      info: emptyColorShades,
      warning: emptyColorShades,
      danger: emptyColorShades,
    },
    qrcodeURL: '',
  },
  {
    _id: '1',
    showCompanyName: true,
    announcement: 'test',
    address: 'rua teste 2',
    cnpj: '03.778.130/0001-49',
    companyName: 'Teste 2',
    uri: 'plataforma-nortan.ag37e.mongodb.net/teste',
    contractsMeta: 8000,
    taxesMeta: 5000,
    oeMeta: 3000,
    youtubeLink: 'youtubeTeste',
    glassfrogLink: 'glassTeste',
    gathertownLink: 'gathertownTeste',
    instagramLink: 'instagramTeste',
    linkedinLink: 'linkedinLinkTeste',
    logoDefault: {
      url: '',
      name: '',
    },
    logoWithoutName: {
      url: '',
      name: '',
    },
    logoWhite: {
      url: '',
      name: '',
    },
    logoWhiteWithoutName: {
      url: '',
      name: '',
    },
    logoSupport: {
      url: '',
      name: '',
    },
    colors: {
      primary: emptyColorShades,
      success: emptyColorShades,
      info: emptyColorShades,
      warning: emptyColorShades,
      danger: emptyColorShades,
    },
    qrcodeURL: '',
  },
];
