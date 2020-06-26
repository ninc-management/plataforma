const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');

const User = require('../models/user');
const saltRounds = 12;

const router = express.Router();

router.post('/register', (req, res, next) => {
  bcrypt.hash(req.body.password, saltRounds).then((hash) => {
    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      state: req.body.state,
      city: req.body.city,
      education: req.body.education,
      arquitetura: req.body.arquitetura ? req.body.arquitetura : false,
      design: req.body.design ? req.body.design : false,
      civil: req.body.civil ? req.body.civil : false,
      eletrica: req.body.eletrica ? req.body.eletrica : false,
      sanitaria: req.body.sanitaria ? req.body.sanitaria : false,
      impermeabilizacao: req.body.impermeabilizacao
        ? req.body.impermeabilizacao
        : false,
      ambiental: req.body.ambiental ? req.body.ambiental : false,
      hidrico: req.body.hidrico ? req.body.hidrico : false,
      password: hash,
      more: req.body.more ? req.body.more : false,
      meet: req.body.more ? req.body.meet : '',
    });
    user
      .save()
      .then(() => {
        const token = jwt.sign(
          { email: user.email, userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        res.redirect(
          307,
          '/api/sendmail/?' +
            querystring.stringify({
              token: token,
            })
        );
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  });
});

router.post('/login', (req, res, next) => {
  let fetchedUser;
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        throw new Error('Email não encontrado!');
      }
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then((result) => {
      if (!result) {
        return res.status(401).json({
          message: 'Senha não confere.',
        });
      }
      const token = jwt.sign(
        { email: fetchedUser.email, userId: fetchedUser._id },
        process.env.JWT_SECRET,
        { expiresIn: req.body.rememberMe ? '30 days' : '1h' }
      );
      res.status(200).json({
        token: token,
      });
    })
    .catch((err) => {
      return res.status(401).json({
        message: 'Email não cadastrado.',
      });
    });
});

router.post('/request-pass', (req, res, next) => {
  return res.status(200).json({});
});

router.put('/reset-pass', (req, res, next) => {
  return res.status(200).json({});
});

router.delete('/logout', (req, res, next) => {
  return res.status(204).json({});
});

router.post('/refresh-token', (req, res, next) => {
  return res.status(204).json({});
});

module.exports = router;
