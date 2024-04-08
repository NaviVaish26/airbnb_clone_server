const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Booking = require('../models/Booking');
const User = require('../models/User');

require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;

function getUserDataFromReq(req) {
  if (!req.cookies.token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

router.post('/', async (req, res) => {
  if (!req.cookies.token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const userData = await getUserDataFromReq(req);
    const { place, checkIn, checkOut, guestNumb, name, phone, price } =
      req.body;
    Booking.create({
      place,
      user: userData.id,
      checkIn,
      checkOut,
      guestNumb,
      name,
      phone,
      price,
    })
      .then((doc) => {
        res.json(doc);
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    // console.error(error);
    throw error;
  }
});

router.get('/', async (req, res) => {
  if (!req.cookies.token) {
    console.log('bookings get no token');
    res.json(null);
  }
  try {
    const _id = jwt.verify(
      req.cookies.token,
      jwtSecret,
      {},
      async (err, userData) => {
        if (err) throw err;
        const user = await User.findById(userData.id);
        const bookings = await Booking.find({ user: user._id }).populate(
          'place'
        );
        if (bookings.length === 0) {
          res.json(null);
        } else {
          res.json(bookings);
        }
      }
    );
  } catch (error) {
    res.status(404).json(error);
  }
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await Booking.findByIdAndDelete(id);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
