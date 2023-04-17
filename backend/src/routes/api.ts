import * as express from 'express';
import { isEqual } from 'lodash';

import * as app from '../app';

const router = express.Router();

router.post('/checkdb', (req, res, next) => {
  return res.status(200).json({
    isUpdated: isEqual(app.default.api.lastChange, req.body.change),
  });
});

export default router;
