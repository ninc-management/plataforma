const express = require('express');

const User = require('../models/user');

const router = express.Router();

router.post('/', (req, res, next) => {
  let fetchedUser;
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      return res.status(401).json({
        message: 'Email não cadastrado.',
      });
    }
    fetchedUser = user;
    return res.status(200).json(fetchedUser.toJSON());
  });
});

module.exports = router;
