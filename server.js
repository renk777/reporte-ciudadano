const express = require('express');
const cors = require('cors');
const app = express();

const reportRoutes = require('./reportRoutes');

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/', reportRoutes);

app.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});