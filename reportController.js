const db = require('./db');

exports.crearReporte = (req, res) => {
  const { descripcion, ubicacion } = req.body;
  const imagenes = req.files;

  const sqlReporte = "INSERT INTO reportes (descripcion, ubicacion) VALUES (?, ?)";

  db.query(sqlReporte, [descripcion, ubicacion], (err, result) => {
    if (err) {
      console.error("Error al guardar reporte:", err);
      return res.status(500).json({ message: "Error al guardar el reporte" });
    }

    const reporteId = result.insertId;

    if (imagenes && imagenes.length > 0) {

      const valores = imagenes.map(img => [reporteId, img.path]);

      const sqlImagenes = "INSERT INTO imagenes (reporte_id, ruta) VALUES ?";

      db.query(sqlImagenes, [valores], (err2) => {
        if (err2) {
          console.error("Error al guardar imágenes:", err2);
          return res.status(500).json({ message: "Error al guardar imágenes" });
        }

        res.json({ message: "Reporte con imágenes guardado correctamente" });
      });

    } else {
      res.json({ message: "Reporte guardado sin imágenes" });
    }

  });
};