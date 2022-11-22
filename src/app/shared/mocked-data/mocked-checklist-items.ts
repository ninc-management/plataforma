import { AVALIABLE_MANAGEMENT_STATUS } from '../services/contract.service';
import { externalMockedUsers } from './mocked-users';

import { ChecklistItemAction, ContractChecklistItem, DateRange } from '@models/contract';

export const externalMockedChecklistItemActions: ChecklistItemAction[] = [
  {
    name: 'TestAction1',
    range: new DateRange(),
    assignee: externalMockedUsers[0],
    isFinished: false,
    locals: {
      isNew: true,
      parentItemName: '',
    },
  },
  {
    name: 'TestAction2',
    range: new DateRange(),
    assignee: externalMockedUsers[0],
    isFinished: false,
    locals: {
      isNew: true,
      parentItemName: '',
    },
  },
];

export const externalMockedChecklistItems: ContractChecklistItem[] = [
  {
    description: 'Test',
    actionList: [externalMockedChecklistItemActions[0]],
    assignee: externalMockedUsers[0],
    name: 'TestItem1',
    range: new DateRange(),
    status: AVALIABLE_MANAGEMENT_STATUS.ESPERA,
    locals: {
      isNew: true,
    },
  },
  {
    description: 'Test',
    actionList: [externalMockedChecklistItemActions[1]],
    assignee: externalMockedUsers[0],
    name: 'TestItem2',
    range: new DateRange(),
    status: AVALIABLE_MANAGEMENT_STATUS.ESPERA,
    locals: {
      isNew: true,
    },
  },
];
