import * as express from 'express';
import PromotionModel from '../models/promotion';
import { Promotion } from '../models/promotion';
import { Mutex } from 'async-mutex';

const router = express.Router();
let requested = false;
const promotionsMap: Record<string, Promotion> = {};
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const promotion = new PromotionModel(req.body.promotion);
  mutex.acquire().then((release) => {
    promotion
      .save()
      .then((savedPromotion) => {
        if (requested) {
          const tempPromotion: Promotion = savedPromotion.toJSON();
          promotionsMap[tempPromotion._id] = tempPromotion;
        }
        release();
        return res.status(201).json({
          message: 'Promoção cadastrada!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  await PromotionModel.findByIdAndUpdate(
    req.body.promotion._id,
    req.body.promotion,
    { upsert: false, new: false },
    async (err, response) => {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar promoção!',
          error: err,
        });
      if (requested) {
        await mutex.runExclusive(async () => {
          promotionsMap[req.body.promotion._id] = req.body.promotion;
        });
      }
      return res.status(200).json({
        message: 'Promoção Atualizada!',
      });
    }
  );
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const promotions: Promotion[] = await PromotionModel.find({});
    promotions.map((promotion) => (promotionsMap[promotion._id] = promotion));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(promotionsMap)));
});

export default router;
