const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/', reportRoutes);

app.listen(3000, () => {
    console.log("Servidor escuchando en http://localhost:3000");
});