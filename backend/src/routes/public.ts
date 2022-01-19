import * as express from 'express';
import UserModel from '../models/user';
import ContractModel from '../models/contract';
import ContractorModel from '../models/contractor';
import { User } from '../models/user';
import { Contract } from '../models/contract';
import { Contractor } from '../models/contractor';

const router = express.Router();

router.post('/user/all', async (req, res) => {
  const users: User[] = await UserModel.find({});
  return res.status(200).json(
    users
      .filter((user) => user.active)
      .map((user) => ({
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        mainDepartment: user.mainDepartment,
        exibitionName: user.exibitionName,
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
