import * as express from 'express';

import ProviderModel, { Provider } from '../models/provider';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const providerCompanyModel = await getModelForCompany(companyId, ProviderModel);
    const provider = new providerCompanyModel(req.body.provider);
    await provider.save();
    res.status(201).json({
      message: 'Fornecedor cadastrado!',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Erro ao cadastrar fornecedor!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const providerCompanyModel = await getModelForCompany(companyId, ProviderModel);
    const provider = await providerCompanyModel.findOneAndUpdate(
      { _id: req.body.provider._id, __v: req.body.provider.__v },
      req.body.provider,
      { upsert: false }
    );
    if (!provider) {
      return res.status(500).json({
        message: 'O documento foi atualizado por outro usuário. Por favor, reabra o documento e tente novamente.',
      });
    }
    return res.status(200).json({
      message: 'Fornecedor Atualizado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar fornecedor!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const providerCompanyModel = await getModelForCompany(companyId, ProviderModel);
    const providers: Provider[] = await providerCompanyModel.find({});
    return res.status(200).json(providers);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar fornecedores!',
      error: err,
    });
  }
});

export default router;
