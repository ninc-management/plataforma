import * as express from 'express';
import UserModel from '../models/user';
import { User } from '../models/user';
import { Mutex } from 'async-mutex';

const router = express.Router();
let requested = false;
const usersMap: Record<string, User> = {};
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const user = new UserModel(req.body.user);
  mutex.acquire().then((release) => {
    user
      .save()
      .then((savedUser) => {
        if (requested) usersMap[savedUser._id] = savedUser.toJSON();
        release();
        return res.status(201).json({
          message: 'Usuário cadastrado!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar usuário!',
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  await UserModel.findByIdAndUpdate(
    req.body.user._id,
    req.body.user,
    { upsert: false, new: false },
    async (err, savedUser) => {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar usuário!',
          error: err,
        });
      if (requested) {
        await mutex.runExclusive(async () => {
          usersMap[req.body.user._id] = savedUser.toJSON();
        });
      }
      return res.status(200).json({
        message: 'Usuário Atualizado!',
      });
    }
  );
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const users: User[] = await UserModel.find({});
    users.map((user) => (usersMap[user._id] = user));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(usersMap)));
});

export default router;
