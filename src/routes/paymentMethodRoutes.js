// routes/paymentMethodRoutes.js
const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Rutas públicas (para obtener métodos activos)
router.get('/activos', paymentMethodController.obtenerActivos);

// Rutas protegidas (solo admin)
router.get('/', authMiddleware, requireRole(['admin', 'superadmin']), paymentMethodController.obtenerTodos);
router.get('/:codigo', authMiddleware, requireRole(['admin', 'superadmin']), paymentMethodController.obtenerPorCodigo);
router.post('/', authMiddleware, requireRole(['admin', 'superadmin']), paymentMethodController.crear);
router.put('/:codigo', authMiddleware, requireRole(['admin', 'superadmin']), paymentMethodController.actualizar);
router.delete('/:codigo', authMiddleware, requireRole(['admin', 'superadmin']), paymentMethodController.eliminar);
router.patch('/:codigo/estado', authMiddleware, requireRole(['admin', 'superadmin']), paymentMethodController.cambiarEstado);

module.exports = router;