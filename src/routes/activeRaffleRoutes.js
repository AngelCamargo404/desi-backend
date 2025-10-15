// routes/activeRaffleRoutes.js - SIMPLIFICADO
const express = require('express');
const router = express.Router();
const activeRaffleController = require('../controllers/activeRaffleController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Ruta pública
router.get('/activa', activeRaffleController.obtenerRifaActiva);

// Rutas protegidas (admin)
router.post('/activar', authMiddleware, requireRole(['admin', 'superadmin']), activeRaffleController.activarRifa);
router.get('/info', authMiddleware, requireRole(['admin', 'superadmin']), activeRaffleController.obtenerInfoRifaActiva);
router.delete('/desactivar', authMiddleware, requireRole(['admin', 'superadmin']), activeRaffleController.desactivarTodas);

module.exports = router;