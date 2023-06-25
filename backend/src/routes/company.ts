import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep } from 'lodash';

import CompanyModel, { Company } from '../models/company';
import { companyMap } from '../shared/global';

const router = express.Router();
let requested = false;
const mutex = new Mutex();

router.post('/', async (req, res, next) => {
  const company = new CompanyModel(req.body.company);
  mutex.acquire().then((release) => {
    company
      .save()
      .then((savedCompany) => {
        if (requested) companyMap[savedCompany._id] = cloneDeep(savedCompany.toJSON());
        release();
        return res.status(201).json({
          message: 'Empresa cadastrada!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar empresa!',
          error: err,
        });
      });
  });
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const companies: Company[] = await CompanyModel.find({});
    companies.map((company) => (companyMap[company._id] = cloneDeep(company)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(companyMap)));
});

router.post('/update', async (req, res, next) => {
  try {
    const company = await CompanyModel.findOneAndUpdate(
      { _id: req.body.company._id, __v: req.body.company.__v },
      req.body.company,
      { upsert: false }
    );
    if (!company) {
      return res.status(500).json({
        message: 'O documento foi atualizado por outro usuário. Por favor, recarregue os dados e tente novamente.',
      });
    }
    if (requested) {
      await mutex.runExclusive(async () => {
        companyMap[req.body.company._id] = cloneDeep(company.toJSON());
      });
    }
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
