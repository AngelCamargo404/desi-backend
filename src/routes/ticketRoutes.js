const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { upload, handleUploadErrors } = require('../config/upload');

// ... (mantener todas las rutas existentes)

// @desc    Comprar ticket (con comprobante)
// @route   POST /api/tickets/:id/comprar
// @access  Public
router.post('/:id/comprar', upload, handleUploadErrors, ticketController.comprarTicket);

// @desc    Obtener tickets por estado/ciudad
// @route   GET /api/tickets/estado-ciudad/:estadoCiudad
// @access  Public
router.get('/estado-ciudad/:estadoCiudad', ticketController.obtenerTicketsPorEstadoCiudad);

// @desc    Verificar ticket
// @route   POST /api/tickets/:id/verificar
// @access  Public
router.post('/:id/verificar', ticketController.verificarTicket);

// @desc    Obtener tickets no verificados
// @route   GET /api/tickets/no-verificados
// @access  Public
router.get('/no-verificados', ticketController.obtenerTicketsNoVerificados);

// @desc    Actualizar comprobante
// @route   PATCH /api/tickets/:id/comprobante
// @access  Public
router.patch('/:id/comprobante', upload, handleUploadErrors, ticketController.actualizarComprobante);

module.exports = router;