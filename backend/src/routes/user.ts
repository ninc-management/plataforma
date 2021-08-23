import * as express from 'express';
import User from '../models/user';

const router = express.Router();

router.post('/update', async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.body.user._id,
    req.body.user,
    { upsert: false, new: false },
    function (err, response) {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar usuário!',
          error: err,
        });
      return res.status(200).json({
        message: 'Usuário Atualizado!',
      });
    }
  );
});

router.post('/all', async (req, res) => {
  const users = await User.find({}).populate('expertise').lean();
  return res.status(200).json(users);
});

export default router;
