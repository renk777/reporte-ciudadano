const express = require('express');
const router = express.Router();
const multer = require('multer');
const reportController = require('./reportController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + '-' + file.originalname;
    cb(null, nombreUnico);
  }
});

const upload = multer({ storage });

router.post('/reporte', upload.array('imagenes', 10), reportController.crearReporte);

module.exports = router;