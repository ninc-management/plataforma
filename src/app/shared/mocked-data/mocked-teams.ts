import { externalMockedSectors } from './mocked-sectors';
import { externalMockedTransactions } from './mocked-transaction';
import { externalMockedUsers } from './mocked-users';

import { Team } from '@models/team';

export const externalMockedTeams: Team[] = [
  {
    _id: '0',
    name: 'Test Team 0',
    leader: externalMockedUsers[0],
    members: [
      {
        user: externalMockedUsers[0],
        sectors: ['0'],
      },
      {
        user: externalMockedUsers[1],
        sectors: ['1'],
      },
    ],
    created: new Date(),
    purpose: 'To test',
    receipts: [],
    expenses: [],
    config: {
      path: 'testPath',
    },
    abrev: 'EMT1',
    isOrganizationTeam: false,
    sectors: [externalMockedSectors[0]],
    overrideSupportPercentages: false,
    overrideIntermediationPercentages: false,
    supportOrganizationPercentage: '0,00',
    supportNfPercentage: '0,00',
    intermediationOrganizationPercentage: '',
    intermediationNfPercentage: '',
    locals: {
      balance: '0,00',
      leaderName: externalMockedUsers[0].name,
    },
  },
  {
    _id: '1',
    name: 'Test Team 1',
    leader: externalMockedUsers[2],
    members: [
      {
        user: externalMockedUsers[2],
        sectors: [],
      },
    ],
    created: new Date(),
    purpose: 'To test',
    receipts: [
      externalMockedTransactions[2],
      externalMockedTransactions[3],
      externalMockedTransactions[4],
      externalMockedTransactions[5],
    ],
    expenses: [],
    config: {
      path: 'testPath',
    },
    abrev: 'EMT2',
    isOrganizationTeam: true,
    sectors: [externalMockedSectors[1]],
    overrideSupportPercentages: false,
    overrideIntermediationPercentages: false,
    supportOrganizationPercentage: '0,00',
    supportNfPercentage: '0,00',
    intermediationOrganizationPercentage: '',
    intermediationNfPercentage: '',
    locals: {
      balance: '0,00',
      leaderName: externalMockedUsers[0].name,
    },
  },
];
