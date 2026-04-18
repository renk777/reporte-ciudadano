const express = require('express');
const router = express.Router();
const multer = require('multer');
const reportController = require('./reportController');
 
// Guardar imágenes en memoria (no depende de carpeta uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });
 
router.post('/reporte', upload.array('imagenes', 10), reportController.crearReporte);
 
module.exports = router;
 