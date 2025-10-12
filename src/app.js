const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de comprobantes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir archivos estáticos de React (después del build)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Importar rutas de la API
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Para cualquier otra ruta, servir la aplicación React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});