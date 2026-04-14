const express = require('express');
const router = express.Router();
const multer = require('multer');
const reportController = require('../controllers/reportController');


const upload = multer({ dest: 'uploads/' }); 

// CAMBIO AQUÍ: La ruta ahora es "/reporte" (como en tu fetch)

router.post('/reporte', upload.single('imagen'), reportController.crearReporte);

module.exports = router;