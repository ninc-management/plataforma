import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep } from 'lodash';

import PromotionModel, { Promotion } from '../models/promotion';
import { promotionsMap } from '../shared/global';

const router = express.Router();
let requested = false;
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const promotion = new PromotionModel(req.body.promotion);
  mutex.acquire().then((release) => {
    promotion
      .save()
      .then((savedPromotion) => {
        if (requested) promotionsMap[savedPromotion._id] = cloneDeep(savedPromotion.toJSON());
        release();
        return res.status(201).json({
          message: 'Promoção cadastrada!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar promoção!',
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  try {
    const savedPromotion = await PromotionModel.findByIdAndUpdate(req.body.promotion._id, req.body.promotion, {
      upsert: false,
    });
    if (requested) {
      await mutex.runExclusive(async () => {
        promotionsMap[req.body.promotion._id] = cloneDeep(savedPromotion.toJSON());
      });
    }
    return res.status(200).json({
      message: 'Promoção Atualizada!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar promoção!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const promotions: Promotion[] = await PromotionModel.find({});
    promotions.map((promotion) => (promotionsMap[promotion._id] = cloneDeep(promotion)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(promotionsMap)));
});

export default router;
