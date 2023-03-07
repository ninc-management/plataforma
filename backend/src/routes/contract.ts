import * as express from 'express';

import ContractModel, { Contract } from '../models/contract';
import MessageModel, { Message } from '../models/message';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const contractCompanyModel = await getModelForCompany(companyId, ContractModel);
    const contract = new contractCompanyModel(req.body.contract);
    await contract.save();
    return res.status(201).json({
      message: 'Contrato cadastrado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao cadastrar contrato!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const contractCompanyModel = await getModelForCompany(companyId, ContractModel);
    const contract = await contractCompanyModel.findOneAndUpdate(
      { _id: req.body.contract._id, __v: req.body.contract.__v },
      req.body.contract,
      { upsert: false }
    );
    if (!contract) {
      return res.status(500).json({
        message: 'O documento foi atualizado por outro usuário. Por favor, recarregue os dados e tente novamente.',
      });
    }
    return res.status(200).json({
      message: 'Contrato Atualizado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar contrato!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const contractCompanyModel = await getModelForCompany(companyId, ContractModel);
    const contracts: Contract[] = await contractCompanyModel.find({});
    return res.status(200).json(contracts);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar contratos!',
      error: err,
    });
  }
});

router.post('/createMessage', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const messageCompanyModel = await getModelForCompany(companyId, MessageModel);
    const message = new messageCompanyModel(req.body.message);
    await message.save();
    return res.status(201).json({
      message: 'Comentário cadastrado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao cadastrar comentário!',
      error: err,
    });
  }
});

router.post('/allMessages', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const messageCompanyModel = await getModelForCompany(companyId, MessageModel);
    const messages: Message[] = await messageCompanyModel.find({});
    return res.status(200).json(messages);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar comentários',
      error: err,
    });
  }
});

export default router;
