// routes/winnerRoutes.js
const express = require('express');
const router = express.Router();
const winnerController = require('../controllers/winnerController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Rutas protegidas
router.post('/raffle/:raffleId/random-winner', authMiddleware, requireRole(['admin', 'superadmin']), winnerController.seleccionarGanadorAleatorio);
router.get('/raffle/:raffleId', authMiddleware, requireRole(['admin', 'superadmin']), winnerController.obtenerGanadoresPorRifa);

// Obtener todos los ganadores
router.get('/', authMiddleware, requireRole(['admin', 'superadmin']), winnerController.obtenerTodosLosGanadores);

// Actualizar estado de entrega
router.put('/:id/entrega', authMiddleware, requireRole(['admin', 'superadmin']), winnerController.actualizarEstadoEntrega);

module.exports = router;