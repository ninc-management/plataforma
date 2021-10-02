import * as express from 'express';
import TeamModel from '../models/team';
import { Team } from '../models/team';
import { Mutex } from 'async-mutex';
import { cloneDeep } from 'lodash';

const router = express.Router();
let requested = false;
const teamMap: Record<string, Team> = {};
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
  await TeamModel.findByIdAndUpdate(req.body.team._id, req.body.team, { upsert: false }, async (err, savedTeam) => {
    if (err)
      return res.status(500).json({
        message: 'Erro ao atualizar time!',
        error: err,
      });
    if (requested) {
      await mutex.runExclusive(async () => {
        teamMap[req.body.team._id] = cloneDeep(savedTeam.toJSON());
      });
    }
    return res.status(200).json({
      message: 'Time Atualizado!',
    });
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
