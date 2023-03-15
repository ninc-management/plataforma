import * as express from 'express';

import PromotionModel, { Promotion } from '../models/promotion';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const promotionCompanyModel = await getModelForCompany(companyId, PromotionModel);
    const promotion = new promotionCompanyModel(req.body.promotion);
    await promotion.save();
    return res.status(201).json({
      message: 'Promoção cadastrada!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao cadastrar promoção!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const promotionCompanyModel = await getModelForCompany(companyId, PromotionModel);
    await promotionCompanyModel.findByIdAndUpdate(req.body.promotion._id, req.body.promotion, {
      upsert: false,
    });
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
  try {
    const companyId = req.headers.companyid as string;
    const promotionCompanyModel = await getModelForCompany(companyId, PromotionModel);
    const promotions: Promotion[] = await promotionCompanyModel.find({});
    return res.status(200).json(promotions);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar promoção!',
      error: err,
    });
  }
});

export default router;
