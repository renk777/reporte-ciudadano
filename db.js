const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1029721470k.',
    database: 'reportes_ciudad'
});

conexion.connect((err) => {
    if (err) {
        console.error("Error de conexión:", err);
        return;
    }
    console.log("Conectado a MySQL");
});

module.exports = conexion;