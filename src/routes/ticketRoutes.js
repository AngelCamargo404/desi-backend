// routes/ticketRoutes.js - AGREGAR nuevas rutas
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { upload, handleUploadErrors } = require('../config/upload');

// Rutas existentes...
router.get('/rifa/:rifaId/numeros-ocupados', ticketController.obtenerNumerosOcupados);
router.get('/metodos-pago', ticketController.obtenerMetodosPago);
router.get('/metodos-pago/:metodoPago', ticketController.obtenerInformacionMetodoPago);

// NUEVAS RUTAS para compras agrupadas
router.get('/rifa/:rifaId/verificar-tickets', ticketController.verificarTicketsPorEmail);
router.get('/rifa/:rifaId/compras', ticketController.obtenerComprasPorRifa);
router.post('/compra/:transaccionId/verificar', ticketController.verificarCompra);

// Rutas existentes...
router.get('/rifa/:rifaId', ticketController.obtenerTicketsPorRifa);
router.post('/comprar', upload, handleUploadErrors, ticketController.comprarTicket);
router.get('/estado-ciudad/:estadoCiudad', ticketController.obtenerTicketsPorEstadoCiudad);
router.post('/:id/verificar', ticketController.verificarTicket);
router.get('/no-verificados', ticketController.obtenerTicketsNoVerificados);
router.patch('/:id/comprobante', upload, handleUploadErrors, ticketController.actualizarComprobante);

module.exports = router;