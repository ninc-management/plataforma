import * as express from 'express';

import CompanyModel, { Company } from '../models/company';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const companyModel = await getModelForCompany(companyId, CompanyModel);
    const company = new companyModel(req.body.company);
    await company.save();
    return res.status(201).json({
      message: 'Empresa cadastrada!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao cadastrar empresa!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const companyModel = await getModelForCompany(companyId, CompanyModel);
    const companies: Company[] = await companyModel.find({});
    return res.status(200).json(companies);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar empresas!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const companyModel = await getModelForCompany(companyId, CompanyModel);
    await companyModel.findByIdAndUpdate(req.body.company._id, req.body.company, {
      upsert: false,
    });
    return res.status(200).json({
      message: 'Dados da empresa atualizados!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar dados da empresa!',
      error: err,
    });
  }
});

export default router;
