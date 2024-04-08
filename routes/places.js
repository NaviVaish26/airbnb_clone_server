const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Place = require('../models/Place');
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;

router.get('/', async (req, res) => {
  try {
    res.json(await Place.find());
  } catch (error) {
    res.status(404).json(error);
  }
});

router.get('/user', async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    res.status(401).json('could not verify user');
  }
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    res.json(await Place.findById(id));
  } catch (error) {
    res.json(null);
  }
});

router.post('/', (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    res.status(404);
  }

  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkout,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    try {
      const placeDoc = await Place.create({
        owner: userData.id,
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkout,
        maxGuests,
        price,
      });
      res.json(placeDoc);
    } catch (error) {
      res.status(422).json(error);
    }
  });
});

router.put('/', async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    // console.log(' put');
    res.status(404);
  }

  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkout,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    try {
      const placeDoc = await Place.findById(id);
      if (userData.id === placeDoc.owner.toString()) {
        placeDoc.set({
          title,
          address,
          photos: addedPhotos,
          description,
          perks,
          extraInfo,
          checkIn,
          checkout,
          maxGuests,
          price,
        });
        await placeDoc.save();
        res.json('ok');
      }
    } catch (error) {
      res.status(422).json(error);
    }
  });
});

module.exports = router;
