const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const download = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const Place = require('./models/Place');
const Booking = require('./models/Booking');
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

require('dotenv').config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'hfikf345gkawegfi636-=[uwfgkiuwg';

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:5173',
  })
);

mongoose.connect(process.env.MONGO_URL);

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.post('/register', async (req, res) => {
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

app.post('/login', async (req, res) => {
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

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json(true);
});

app.post('/upload-by-link', async (req, res) => {
  const { link } = req.body;
  const newName = Date.now() + '.jpg';
  const options = {
    url: link,
    dest: __dirname + '/uploads/' + newName,
  };
  await download.image(options);
  res.json(newName);
});

const photosMiddleware = multer({ dest: 'uploads' });

app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads/', ''));
  }
  res.json(uploadedFiles);
});

app.post('/places', (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    console.log('places');
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

app.get('/user-places', (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    console.log('user-places');
    res.status(404);
  }
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

app.get('/places/:id', async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});

app.put('/places', async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    console.log('places put');
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

app.get('/places', async (req, res) => {
  try {
    res.json(await Place.find());
  } catch (error) {
    res.status(404).json(error);
  }
});

app.post('/bookings', async (req, res) => {
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

app.get('/bookings', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    res.json(await Booking.find({ user: userData.id }).populate('place'));
  } catch (error) {
    res.status(404).json(error);
  }
});

app.delete('/bookings/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await Booking.findByIdAndDelete(id);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT);
