import * as express from 'express';
import { isEqual } from 'lodash';

import * as app from '../app';
import { EventsChecker } from '../models/platformConfig';

const router = express.Router();

router.post('/checkdb', (req, res, next) => {
  return res.status(200).json({
    isUpdated: isEqual(app.default.api.lastChanges.head(), req.body.change),
    newEvents: app.default.api.lastChanges.elementsAfter(req.body.change),
  } as EventsChecker<object>);
});

export default router;
