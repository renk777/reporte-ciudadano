const express = require('express');
const router = express.Router();
const multer = require('multer');
const reportController = require('./reportController');

// Guardar en memoria para enviarlo a Cloudinary(cloudinary es donde se almacenan las imagenes)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/reporte', upload.array('imagenes', 10), reportController.crearReporte);

module.exports = router;