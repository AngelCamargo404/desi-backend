// routes/raffleRoutes.js
const express = require('express');
const router = express.Router();
const raffleController = require('../controllers/raffleController');
const { handleUploadErrors } = require('../config/upload');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware'); // Importar el middleware
const uploadRaffle = require('../middleware/uploadRaffle');

// Rutas públicas
router.get('/activa', raffleController.obtenerRifaActiva);
router.get('/:id', raffleController.obtenerRaffle);

// Rutas protegidas (requieren autenticación)
router.post('/', authMiddleware, requireRole(['admin', 'superadmin']), uploadRaffle, raffleController.crearRaffle);
router.get('/', authMiddleware, requireRole(['admin', 'superadmin']), raffleController.obtenerRaffles);
router.put('/:id', authMiddleware, requireRole(['admin', 'superadmin']), raffleController.actualizarRaffle);
router.delete('/:id', authMiddleware, requireRole(['admin', 'superadmin']), raffleController.eliminarRaffle);
router.patch('/:id/imagen', authMiddleware, requireRole(['admin', 'superadmin']), uploadRaffle, handleUploadErrors, raffleController.actualizarImagen);
router.get('/admin/estadisticas', authMiddleware, requireRole(['admin', 'superadmin']), raffleController.obtenerEstadisticas);

module.exports = router;