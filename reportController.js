require('dotenv').config();
const pool = require('./db');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Subir buffer a Cloudinary
function subirACloudinary(buffer, nombreArchivo) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'reportes_ciudadanos', public_id: Date.now() + '-' + nombreArchivo },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

exports.crearReporte = async (req, res) => {
  const { descripcion, ubicacion } = req.body;
  const imagenes = req.files;

  const sqlReporte = "INSERT INTO reportes (descripcion, ubicacion) VALUES (?, ?)";

  pool.query(sqlReporte, [descripcion, ubicacion], async (err, result) => {
    if (err) {
      console.error("Error al guardar reporte:", err);
      return res.status(500).json({ message: "Error al guardar el reporte" });
    }

    const reporteId = result.insertId;

    if (imagenes && imagenes.length > 0) {
      try {
        // Subir cada imagen a Cloudinary
        const urls = await Promise.all(
          imagenes.map(img => subirACloudinary(img.buffer, img.originalname))
        );

        const valores = urls.map(url => [reporteId, url]);
        const sqlImagenes = "INSERT INTO imagenes (reporte_id, ruta) VALUES ?";

        pool.query(sqlImagenes, [valores], (err2) => {
          if (err2) {
            console.error("Error al guardar imágenes:", err2);
            return res.status(500).json({ message: "Error al guardar imágenes" });
          }
          return res.json({ message: "Reporte guardado correctamente", reporteId });
        });

      } catch (uploadErr) {
        console.error("Error al subir imágenes a Cloudinary:", uploadErr);
        return res.status(500).json({ message: "Error al subir las imágenes" });
      }

    } else {
      return res.json({ message: "Reporte guardado correctamente", reporteId });
    }
  });
};