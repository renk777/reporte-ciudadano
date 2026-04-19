const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('./db');

function verificarRol(rolRequerido) {
  return (req, res, next) => {
    const rol = req.headers['x-rol'];
    if (rol !== rolRequerido) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
}

// RF07: Login con bcrypt(bcrypt l genera un hash para proteger las contraseñas, es como cifrarlas pero con la diferencia de que no se puede revertir)
router.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  const sql = "SELECT id, nombre, usuario, password, rol FROM usuarios WHERE usuario = ?";
  pool.query(sql, [usuario], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Error del servidor" });

    if (results.length === 0) {
      return res.json({ success: false, message: "Credenciales incorrectas" });
    }

    const user = results[0];

    // Comparar contraseña con el hash
    const coincide = await bcrypt.compare(password, user.password);
    if (!coincide) {
      return res.json({ success: false, message: "Credenciales incorrectas" });
    }

    // No enviar el hash al cliente
    return res.json({
      success: true,
      user: { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol }
    });
  });
});

// RF05: Admin - obtener todos los reportes
router.get('/admin/reportes', verificarRol('admin'), (req, res) => {
  const { estado } = req.query;
  let sql = `
    SELECT r.*, u.nombre as entidad_nombre 
    FROM reportes r
    LEFT JOIN usuarios u ON r.entidad_id = u.id
  `;
  const params = [];
  if (estado) { sql += " WHERE r.estado = ?"; params.push(estado); }
  sql += " ORDER BY r.fecha DESC";

  pool.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    res.json(results);
  });
});

// Obtener imagenes de un reporte (admin)
router.get('/admin/reportes/:id/imagenes', verificarRol('admin'), (req, res) => {
  const { id } = req.params;
  pool.query("SELECT ruta FROM imagenes WHERE reporte_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    res.json(results);
  });
});

// Obtener entidades
router.get('/admin/entidades', verificarRol('admin'), (req, res) => {
  pool.query("SELECT id, nombre FROM usuarios WHERE rol = 'entidad'", (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    res.json(results);
  });
});

// RF06: Admin - asignar reporte
router.put('/admin/asignar/:id', verificarRol('admin'), (req, res) => {
  const { id } = req.params;
  const { entidad_id, categoria } = req.body;
  const sql = "UPDATE reportes SET entidad_id = ?, categoria = ?, estado = 'Asignado' WHERE id = ?";
  pool.query(sql, [entidad_id, categoria, id], (err) => {
    if (err) return res.status(500).json({ message: "Error al asignar el reporte" });
    res.json({ message: "Reporte asignado correctamente" });
  });
});

// RF08/RF09: Entidad - obtener sus reportes
router.get('/entidad/reportes', verificarRol('entidad'), (req, res) => {
  const entidad_id = req.headers['x-usuario-id'];
  pool.query("SELECT * FROM reportes WHERE entidad_id = ? ORDER BY fecha DESC", [entidad_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    res.json(results);
  });
});

// Obtener imagenes de un reporte (entidad)
router.get('/entidad/reportes/:id/imagenes', verificarRol('entidad'), (req, res) => {
  const { id } = req.params;
  pool.query("SELECT ruta FROM imagenes WHERE reporte_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    res.json(results);
  });
});

// RF08/RF09: Entidad - actualizar estado
router.put('/entidad/estado/:id', verificarRol('entidad'), (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const entidad_id = req.headers['x-usuario-id'];

  const estadosValidos = ['Asignado', 'En proceso', 'Solucionado'];
  if (!estadosValidos.includes(estado)) return res.status(400).json({ message: "Estado no válido" });

  pool.query("SELECT id FROM reportes WHERE id = ? AND entidad_id = ?", [id, entidad_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (results.length === 0) return res.status(403).json({ message: "No tienes permiso para este reporte" });

    pool.query("UPDATE reportes SET estado = ? WHERE id = ?", [estado, id], (err2) => {
      if (err2) return res.status(500).json({ message: "Error al actualizar" });
      res.json({ message: `Estado actualizado a: ${estado}` });
    });
  });
});

// RF10: Consultar estado publico
router.get('/reporte/estado/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT r.id, r.descripcion, r.ubicacion, r.estado, r.categoria, r.fecha,
           u.nombre as entidad_nombre
    FROM reportes r
    LEFT JOIN usuarios u ON r.entidad_id = u.id
    WHERE r.id = ?
  `;
  pool.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (results.length === 0) return res.status(404).json({ message: "Reporte no encontrado" });
    res.json(results[0]);
  });
});

module.exports = router;