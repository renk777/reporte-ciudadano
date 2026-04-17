const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

const reportRoutes = require('./reportRoutes');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', reportRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor escuchando');
});