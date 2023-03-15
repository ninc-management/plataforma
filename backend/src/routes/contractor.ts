import * as express from 'express';

import ContractorModel, { Contractor } from '../models/contractor';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const contractorCompanyModel = await getModelForCompany(companyId, ContractorModel);
    const contractor = new contractorCompanyModel(req.body.contractor);
    await contractor.save();
    res.status(201).json({
      message: 'Cliente cadastrado!',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Erro ao cadastrar cliente!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const contractorCompanyModel = await getModelForCompany(companyId, ContractorModel);
    await contractorCompanyModel.findByIdAndUpdate(req.body.contractor._id, req.body.contractor, {
      upsert: false,
    });
    return res.status(200).json({
      message: 'Cliente Atualizado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar cliente!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const contractorCompanyModel = await getModelForCompany(companyId, ContractorModel);
    const contractors: Contractor[] = await contractorCompanyModel.find({});
    return res.status(200).json(contractors);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar clientes!',
      error: err,
    });
  }
});

export default router;
