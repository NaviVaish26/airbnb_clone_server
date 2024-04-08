const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const bcryptSalt = bcrypt.genSaltSync(10);
const User = require('../models/User');

router.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    res.json(userDoc);
  } catch (error) {
    res.status(422).json(error);
  }
});

module.exports = router;
