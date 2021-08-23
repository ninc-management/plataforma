import * as express from 'express';
import Promotion from '../models/promotion';

const router = express.Router();

router.post('/', async (req, res, next) => {
  const promotion = new Promotion(req.body.promotion);
  promotion.save(function (err, result) {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      return res.status(201).json({
        message: 'Promoção cadastrada!',
        contract: result,
      });
    }
  });
});

router.post('/update', async (req, res, next) => {
  await Promotion.findByIdAndUpdate(req.body.promotion._id, req.body.promotion);
  return res.status(200).json({
    message: 'Promoção Atualizada!',
  });
});

router.post('/all', async (req, res) => {
  const promotions = await Promotion.find({}).lean();
  return res.status(200).json(promotions);
});

export default router;
