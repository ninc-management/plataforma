import * as express from 'express';
import { isEqual } from 'lodash';

import { Contract } from '../models/contract';
import { Contractor } from '../models/contractor';
import { ContractModel, ContractorModel, TeamModel, UserModel } from '../models/models';
import { Team } from '../models/team';
import { User } from '../models/user';

const router = express.Router();

router.post('/user/all', async (req, res) => {
  const users: User[] = await UserModel.find({});
  const teams: Team[] = await TeamModel.find({});
  return res.status(200).json(
    users
      .filter((user) => user.active)
      .map((user) => ({
        name: user.name,
        profilePicture: user.profilePicture,
        exibitionName: user.exibitionName,
        teamsAsMember: teams
          .filter((team) => team.members.some((member) => isEqual(member.user, user._id)))
          .map((team) => team.name),
      }))
  );
});

router.post('/metric/all', async (req, res) => {
  const users: User[] = await UserModel.find({});
  const contracts: Contract[] = await ContractModel.find({});
  const contractors: Contractor[] = await ContractorModel.find({});
  return res.status(200).json({
    closedContracts: contracts.length,
    openedContracts: contracts.filter((contract) => contract.status == 'Em andamento' || contract.status == 'A receber')
      .length,
    clients: contractors.length,
    members: users.filter((user) => user.active).length,
  });
});

export default router;
