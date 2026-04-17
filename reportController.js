const pool = require('./db');

exports.crearReporte = (req, res) => {
  const { descripcion, ubicacion } = req.body;
  const imagenes = req.files;

  const sqlReporte = "INSERT INTO reportes (descripcion, ubicacion) VALUES (?, ?)";

  pool.query(sqlReporte, [descripcion, ubicacion], (err, result) => {
    if (err) {
      console.error("Error al guardar reporte:", err);
      return res.status(500).json({ message: "Error al guardar el reporte" });
    }

    const reporteId = result.insertId;

    if (imagenes && imagenes.length > 0) {
      const valores = imagenes.map(img => [reporteId, img.path]);
      const sqlImagenes = "INSERT INTO imagenes (reporte_id, ruta) VALUES ?";

      pool.query(sqlImagenes, [valores], (err2) => {
        if (err2) {
          console.error("Error al guardar imágenes:", err2);
          return res.status(500).json({ message: "Error al guardar imágenes" });
        }
        return res.json({ message: "Reporte guardado correctamente", reporteId });
      });

    } else {
      return res.json({ message: "Reporte guardado correctamente", reporteId });
    }
  });
};