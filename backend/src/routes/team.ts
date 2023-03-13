import * as express from 'express';
import { cloneDeep } from 'lodash';

import TeamModel, { Team } from '../models/team';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const teamCompanyModel = await getModelForCompany(companyId, TeamModel);
    const team = new teamCompanyModel(req.body.team);
    await team.save();
    return res.status(201).json({
      message: 'Time cadastrado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao cadastrar time!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const teamCompanyModel = await getModelForCompany(companyId, TeamModel);
    if (req.body.creatingExpense) {
      const newExpense = req.body.team.expenses.pop();
      const team = await teamCompanyModel.findById(req.body.team._id);
      if (team) {
        newExpense.code = '#' + team.expenses.length.toString();
        team.expenses.push(newExpense);
        req.body.team.expenses = cloneDeep(team.expenses);
      }
    }

    const team = await teamCompanyModel.findOneAndUpdate(
      { _id: req.body.team._id, __v: req.body.team.__v },
      req.body.team,
      {
        upsert: false,
      }
    );
    if (!team) {
      return res.status(500).json({
        message: 'O documento foi atualizado por outro usuário. Por favor, recarregue os dados e tente novamente.',
      });
    }
    return res.status(200).json({
      message: 'Time Atualizado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar time!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const teamCompanyModel = await getModelForCompany(companyId, TeamModel);
    const teams: Team[] = await teamCompanyModel.find({});
    return res.status(200).json(teams);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar times!',
      error: err,
    });
  }
});

export default router;
