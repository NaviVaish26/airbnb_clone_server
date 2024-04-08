const express = require('express');
const router = express.Router();

const multer = require('multer');
const cloudinary = require('../utils/cloudinary');

router.post('/by/link', async (req, res) => {
  const { link } = req.body;

  try {
    const filename = await cloudinary.v2.uploader.upload(
      link,
      {
        folder: 'places',
      },
      function (error, result) {
        if (error) console.log(error);
      }
    );
    res.json(filename.secure_url);
  } catch (error) {
    res.status(404).json({ msg: 'something went wrong', error });
  }
});

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
});

router.post('/', upload.array('photos', 100), async (req, res) => {
  try {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
      const b64 = Buffer.from(req.files[i].buffer).toString('base64');
      let dataURI = 'data:' + req.files[i].mimetype + ';base64,' + b64;
      const filename = await cloudinary.uploader.upload(
        dataURI,
        {
          folder: 'places',
        },
        function (error, result) {
          if (error) console.log(error);
        }
      );
      if (filename) uploadedFiles.push(filename.secure_url);
    }
    res.json(uploadedFiles);
  } catch (error) {
    console.log(error);
    res.status(404).json(error);
  }
});

module.exports = router;
