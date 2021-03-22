const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');

const User = require('../models/user');
const saltRounds = 12;

const router = express.Router();

//TODO: Fix register route removing token
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
      emailNortan: req.body.emailNortan ? req.body.emailNortanortan : 'a',
      article: req.body.article ? req.body.article : 'a',
      position: req.body.position ? req.body.position : 'a',
      level: req.body.level ? req.body.level : 'a',
      mainDepartment: req.body.mainDepartment ? req.body.mainDepartment : 'a',
    });
    user
      .save()
      .then(() => {
        const token = jwt.sign(
          { email: user.email, userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        res.status(201).json({
          message: 'Usuário cadastrado com sucesso',
          token: token,
        });
        // res.redirect(
        //   307,
        //   '/api/sendmail/?' +
        //     querystring.stringify({
        //       token: token,
        //     })
        // );
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  });
});

router.post('/isRegistered', (req, res, next) => {
  User.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json({
      isRegistered: !!user,
    });
  });
});

module.exports = router;
