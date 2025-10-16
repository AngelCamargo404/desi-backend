require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rifa-desi-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Enable CORS for all routes and all origins
app.use(cors());

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de comprobantes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir archivos estáticos de React (después del build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Importar rutas de la API
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Para cualquier otra ruta, servir la aplicación (Vite build -> dist)
// Catch-all: cualquier ruta que no sea API ni uploads devuelve el index de la SPA
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});