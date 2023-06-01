import { EXPENSE_TYPES } from '../services/config.service';
import { externalMockedInvoices } from './mocked-invoices';
import { externalMockedUsers } from './mocked-users';

import { COST_CENTER_TYPES, Transaction } from '@models/transaction';

export const externalMockedTransactions: Transaction[] = [
  {
    _id: '0',
    contract: '0',
    author: externalMockedUsers[0],
    costCenter: externalMockedUsers[0],
    description: 'TestExpense1',
    nf: false,
    type: EXPENSE_TYPES.APORTE,
    subType: '',
    modelCostCenter: COST_CENTER_TYPES.USER,
    editionHistory: [],
    value: '1.000,00',
    paid: true,
    code: '#0',
    paidDate: new Date(),
    created: new Date(),
    lastUpdate: new Date(),
    uploadedFiles: [],
    team: [
      {
        user: externalMockedUsers[0],
        value: '1.000,00',
        percentage: '100,00',
        sector: 'Trocar',
      },
    ],
  },
  {
    _id: '1',
    author: externalMockedUsers[1],
    costCenter: externalMockedInvoices[0].nortanTeam,
    modelCostCenter: COST_CENTER_TYPES.TEAM,
    description: 'TestExpense2',
    nf: false,
    type: EXPENSE_TYPES.COMISSAO,
    subType: '',
    value: '200,00',
    editionHistory: [],
    paid: true,
    code: '#1',
    paidDate: new Date(),
    created: new Date(),
    lastUpdate: new Date(),
    uploadedFiles: [],
    team: [
      {
        user: externalMockedUsers[0],
        value: '120,00',
        percentage: '60,00',
        sector: 'Trocar',
      },
      {
        user: externalMockedUsers[1],
        value: '80,00',
        percentage: '40,00',
        sector: 'Trocar',
      },
    ],
  },
];
