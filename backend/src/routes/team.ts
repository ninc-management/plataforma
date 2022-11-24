import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep } from 'lodash';

import { TeamModel } from '../models/models';
import { Team } from '../models/team';
import { Transaction } from '../models/transaction';
import { teamMap } from '../shared/global';
import { addTransaction } from './transaction';

const router = express.Router();
let requested = false;
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const team = new TeamModel(req.body.team);
  mutex.acquire().then((release) => {
    team
      .save()
      .then((savedTeam) => {
        if (requested) teamMap[savedTeam._id] = cloneDeep(savedTeam.toJSON());
        release();
        return res.status(201).json({
          message: 'Time cadastrado!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar time!',
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  await mutex.acquire().then(async (release) => {
    if (req.body.creatingTransaction) {
      let newTransaction = req.body.team.expenses.pop();
      newTransaction = await addTransaction(newTransaction, null, newTransaction);
      req.body.team.expenses.push((newTransaction as Transaction)._id);
    }

    try {
      const savedTeam = await TeamModel.findByIdAndUpdate(req.body.team._id, req.body.team, { upsert: false });
      if (requested) {
        teamMap[req.body.team._id] = cloneDeep(savedTeam.toJSON());
      }
      release();
      return res.status(200).json({
        message: 'Time Atualizado!',
      });
    } catch (err) {
      release();
      return res.status(500).json({
        message: 'Erro ao atualizar time!',
        error: err,
      });
    }
  });
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const teams: Team[] = await TeamModel.find({});
    teams.map((team) => (teamMap[team._id] = cloneDeep(team)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(teamMap)));
});

export default router;
