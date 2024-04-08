const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;
const bcrypt = require('bcryptjs');

const User = require('../models/User');

router.post('/', async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        { email: userDoc.email, id: userDoc._id },
        jwtSecret,
        {
          /* option */
        },
        (error, token) => {
          if (error) throw error;
          res.cookie('token', token).json(userDoc);
        }
      );
    } else {
      res.status(422).json('incorrect password');
    }
  } else {
    res.json('not found');
  }
});

module.exports = router;
