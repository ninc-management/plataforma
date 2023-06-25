import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep } from 'lodash';

import TeamModel, { Team } from '../models/team';
import { teamMap } from '../shared/global';

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
    if (req.body.creatingExpense) {
      const newExpense = req.body.team.expenses.pop();
      await TeamModel.findOne({ _id: req.body.team._id }).then((team) => {
        newExpense.code = '#' + team.expenses.length.toString();
        team.expenses.push(newExpense);
        req.body.team.expenses = cloneDeep(team.expenses);
      });
    }

    try {
      const team = await TeamModel.findOneAndUpdate({ _id: req.body.team._id, __v: req.body.team.__v }, req.body.team, {
        upsert: false,
      });
      if (!team) {
        return res.status(500).json({
          message: 'O documento foi atualizado por outro usuário. Por favor, recarregue os dados e tente novamente.',
        });
      }
      if (requested) {
        teamMap[req.body.team._id] = cloneDeep(team.toJSON());
      }
      return res.status(200).json({
        message: 'Time Atualizado!',
      });
    } catch (err) {
      return res.status(500).json({
        message: 'Erro ao atualizar time!',
        error: err,
      });
    } finally {
      release();
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
