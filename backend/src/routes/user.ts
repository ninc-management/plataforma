import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep } from 'lodash';

import { ProspectModel, UserModel } from '../models/models';
import { Prospect } from '../models/prospect';
import { User } from '../models/user';
import { prospectMap, usersMap } from '../shared/global';

const router = express.Router();
let requested = false;
let prospectRequested = false;
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const user = new UserModel(req.body.user);
  mutex.acquire().then((release) => {
    user
      .save()
      .then((savedUser) => {
        if (requested) usersMap[savedUser._id] = cloneDeep(savedUser.toJSON());
        release();
        return res.status(201).json({
          message: 'Associado cadastrado!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar associado!',
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  try {
    const savedUser = await UserModel.findByIdAndUpdate(req.body.user._id, req.body.user, { upsert: false });
    if (requested) {
      await mutex.runExclusive(async () => {
        usersMap[req.body.user._id] = cloneDeep(savedUser.toJSON());
      });
    }
    return res.status(200).json({ message: req.body.successMessage || 'Associado atualizado!' });
  } catch (err) {
    return res.status(500).json({
      message: req.body.errorMessage || 'Erro ao atualizar associado!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const users: User[] = await UserModel.find({});
    users.map((user) => (usersMap[user._id] = cloneDeep(user)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(usersMap)));
});

router.post('/allProspects', async (req, res) => {
  if (!prospectRequested) {
    const prospects: Prospect[] = await ProspectModel.find({});
    prospects.forEach((prospect) => (prospectMap[prospect._id] = cloneDeep(prospect)));
    prospectRequested = true;
  }
  return res.status(200).json(Array.from(Object.values(prospectMap)));
});

router.delete('/approveProspect', async (req, res, next) => {
  ProspectModel.deleteOne({ _id: req.body.prospect._id })
    .then(() => {
      delete prospectMap[req.body.prospect._id];
      const newUser = new UserModel(req.body.prospect);
      newUser
        .save()
        .then((savedUser) => {
          usersMap[savedUser._id] = cloneDeep(savedUser.toJSON());
          return res.status(201).json({
            message: 'Prospecto aprovado com sucesso!',
          });
        })
        .catch((newUserErr) => {
          ProspectModel.create(req.body.prospect)
            .then((prospect) => {
              prospectMap[prospect._id] = cloneDeep(prospect.toJSON());
              return res.status(500).json({
                message: 'Erro ao criar novo usuário! Prospecto recriado.',
                error: newUserErr,
              });
            })
            .catch((prospectErr) => {
              return res.status(500).json({
                message: 'Erro ao recriar prospecto!',
                error: prospectErr,
              });
            });
        });
    })
    .catch((err) => {
      return res.status(500).json({
        message: 'Erro ao apagar o prospecto! Não foi possível aprovar.',
        error: err,
      });
    });
});

export default router;
