import { Contractor } from '@models/contractor';

export const externalMockedContractors: Contractor[] = [
  {
    _id: '0',
    fullName: 'Test1',
    document: '000.000.000-11',
    email: 'test1@te.st',
    address: {
      zipCode: '',
      streetAddress: 'rua teste1',
      houseNumber: '',
      district: '',
      complement: '',
      city: '',
      state: '',
    },
    birthDay: new Date('1990-01-01'),
    phone: '(00) 0000-0000',
    legalRepresentatives: [],
    comercialRepresentatives: [],
  },
  {
    _id: '1',
    fullName: 'Test2',
    document: '000.000.000-12',
    email: 'test2@te.st',
    address: {
      zipCode: '',
      streetAddress: 'rua teste2',
      houseNumber: '',
      district: '',
      complement: '',
      city: '',
      state: '',
    },
    birthDay: new Date('2000-01-01'),
    phone: '(00) 0000-0000',
    legalRepresentatives: [],
    comercialRepresentatives: [],
  },
];
