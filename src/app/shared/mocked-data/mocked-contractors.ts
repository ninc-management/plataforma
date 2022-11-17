import { Contractor } from '@models/contractor';

export const externalMockedContractors: Contractor[] = [
  {
    _id: '0',
    fullName: '',
    document: '',
    email: '',
    address: {
      zipCode: '',
      streetAddress: '',
      houseNumber: '',
      district: '',
      complement: '',
      city: '',
      state: '',
    },
    phone: '',
    legalRepresentatives: [],
    comercialRepresentatives: [],
  },
];
