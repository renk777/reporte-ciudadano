require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const reportRoutes = require('./reportRoutes');
const authRoutes = require('./authRoutes');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', reportRoutes);
app.use('/', authRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor escuchando');
});