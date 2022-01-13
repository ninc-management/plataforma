import * as express from 'express';
import UserModel from '../models/user';
import { User } from '../models/user';

const router = express.Router();

router.post('/user/all', async (req, res) => {
  const users: User[] = await UserModel.find({});
  return res.status(200).json(
    users.map((user) => ({
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      mainDepartment: user.mainDepartment,
      exibitionName: user.exibitionName,
    }))
  );
});

export default router;
