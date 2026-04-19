const bcrypt = require('bcrypt');
const usuarios = [
  { nombre: 'admin',           password: 'admin123' },
  { nombre: 'infraestructura', password: 'infra123' },
  { nombre: 'aseo',            password: 'aseo123' },
  { nombre: 'energia',         password: 'energia123' },
  { nombre: 'alcaldia',        password: 'alcaldia123' }
];

Promise.all(usuarios.map(async u => {
  const hash = await bcrypt.hash(u.password, 10);
  return { nombre: u.nombre, hash };
})).then(results => {
  results.forEach(r => console.log(r.nombre + ': ' + r.hash));
});
