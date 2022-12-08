import {
  PROMOTION_STATOOS,
  RULE_OBJECTS,
  RULE_OPERATORS,
} from 'app/pages/promotions/promotion-item/promotion-item.component';

import { Promotion } from '@models/promotion';

export const externalMockedPromotions: Promotion[] = [
  {
    _id: '0',
    cashback: '15',
    created: new Date(),
    end: new Date(),
    lastUpdate: new Date(),
    name: 'Test',
    rules: [
      {
        container: RULE_OBJECTS.CONTRATOS,
        operator: RULE_OPERATORS.MAIOR_IGUAL,
        value: '1000',
      },
    ],
    start: new Date(),
    status: PROMOTION_STATOOS.EM_ANDAMENTO,
  },
];
