import * as express from 'express';
import { isEqual } from 'lodash';

import ContractModel from '../models/contract';
import ContractorModel from '../models/contractor';
import TeamModel, { Team } from '../models/team';
import UserModel, { User } from '../models/user';

const router = express.Router();

router.post('/user/all', async (req, res) => {
  const users: User[] = await UserModel.find({});
  const teams: Team[] = await TeamModel.find({});
  return res.status(200).json(
    users
      .filter((user) => user.active)
      .map((user) => ({
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        exibitionName: user.exibitionName,
        teamsAsMember: teams
          .filter((team) => team.members.some((member) => isEqual(member.user, user._id)))
          .map((team) => team.name),
      }))
  );
});

router.post('/metric/all', async (req, res) => {
  const contractsCount = await ContractModel.estimatedDocumentCount();
  const usersCount = await UserModel.count({ active: true });
  const openedContractsCount = await ContractModel.count({ status: { $in: ['Em andamento', 'A receber'] } });
  const contractorsCount = await ContractorModel.estimatedDocumentCount();
  return res.status(200).json({
    closedContracts: contractsCount,
    openedContracts: openedContractsCount,
    clients: contractorsCount,
    members: usersCount,
  });
});

export default router;
