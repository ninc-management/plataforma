const express = require('express');

const User = require('../models/user');

const router = express.Router();

router.post('/', (req, res, next) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      return res.status(401).json({
        message: 'Email não cadastrado.',
      });
    }
    return res.status(200).json(user.toJSON());
  });
});

router.post('/update', async (req, res, next) => {
  await User.findOneAndUpdate({ email: req.body.user.email }, req.body.user);
  return res.status(200);
});

module.exports = router;
