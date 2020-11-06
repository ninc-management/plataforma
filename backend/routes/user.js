const express = require('express');

const User = require('../models/user');
const UserExpertise = require('../models/userExpertise');

const router = express.Router();

var mongoObjectId = function () {
  var timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    'xxxxxxxxxxxxxxxx'
      .replace(/[x]/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      })
      .toLowerCase()
  );
};

router.post('/', (req, res, next) => {
  User.findOne({ email: req.body.email })
    .populate('expertise')
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: 'Email não cadastrado.',
        });
      }
      return res.status(200).json(user.toJSON());
    });
});

router.post('/update', async (req, res, next) => {
  // Handle areas of expertise
  if (req.body.user.expertise.length > 0) {
    UserExpertise.bulkWrite(
      req.body.user.expertise.map((expertise) => {
        if (expertise._id == undefined) expertise._id = mongoObjectId();
        if (expertise.__v == undefined) expertise.__v = 0;
        if (expertise.user == undefined) expertise.user = req.body.user._id;
        return {
          updateOne: {
            filter: { _id: expertise._id },
            update: expertise,
            upsert: true,
          },
        };
      })
    )
      .then(() => {
        return UserExpertise.find({ user: req.body.user._id });
      })
      .then((savedExpertises) => {
        req.body.expertise = savedExpertises.map((el) => el._id);
        return User.findOneAndUpdate(
          { email: req.body.user.email },
          req.body.user
        );
      })
      .then(() => {
        res.status(200).json({
          message: 'Usuário Atualizado!',
        });
      })
      .catch((err) => {
        res.status(500).json({
          message:
            'Erro ao adicionar e atualizar atuações enquanto atualiza usuário!',
          error: err,
        });
      });
  } else {
    //Update user
    await User.findOneAndUpdate({ email: req.body.user.email }, req.body.user);
    return res.status(200).json({
      message: 'Usuário Atualizado!',
    });
  }
});

router.post('/all', async (req, res) => {
  users = await User.find({}).populate('expertise');
  return res.status(200).json(users);
});

module.exports = router;
