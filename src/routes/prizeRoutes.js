// routes/prizeRoutes.js
const express = require('express');
const router = express.Router();
const prizeController = require('../controllers/prizeController');
const { upload, handleUploadErrors } = require('../config/upload');

// Middleware de autenticación (placeholder)
const auth = (req, res, next) => {
  // Aquí iría la verificación del token JWT
  // Por ahora, es un placeholder
  next();
};

// Rutas públicas
router.get('/rifa/:rifaId', prizeController.obtenerPrizesPorRifa);
router.get('/rifa/:rifaId/estadisticas', prizeController.obtenerEstadisticas);
router.get('/rifa/:rifaId/posiciones', prizeController.verificarPosiciones);
router.get('/rifa/:rifaId/ganador/:posicion', prizeController.obtenerGanadorPorPosicion);
router.get('/:id', prizeController.obtenerPrize);

// Rutas protegidas (requieren autenticación)
router.post('/', auth, prizeController.crearPrize);
router.post('/rifa/:rifaId/multiples', auth, prizeController.crearPremiosParaRifa);
router.get('/', auth, prizeController.obtenerPrizes);
router.put('/:id', auth, prizeController.actualizarPrize);
router.delete('/:id', auth, prizeController.eliminarPrize);
router.patch('/:id/asignar-ganador', auth, prizeController.asignarGanador);
router.patch('/:id/desasignar-ganador', auth, prizeController.desasignarGanador);
router.patch('/:id/imagen', auth, upload, handleUploadErrors, prizeController.actualizarImagen);

module.exports = router;