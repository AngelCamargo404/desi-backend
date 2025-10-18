// routes/index.js
const express = require('express');
const router = express.Router();

// Importar rutas
const ticketRoutes = require('./ticketRoutes');
const authRoutes = require('./authRoutes');
const raffleRoutes = require('./raffleRoutes');
const prizeRoutes = require('./prizeRoutes'); // Nueva ruta de premios
const activeRaffleRoutes = require('./activeRaffleRoutes');
const winnerRoutes = require('./winnerRoutes');
const paymentMethodRoutes = require('./paymentMethodRoutes');

// Usar rutas
router.use('/tickets', ticketRoutes);
router.use('/auth', authRoutes);
router.use('/raffles', raffleRoutes);
router.use('/prizes', prizeRoutes); // Agregar esta línea
router.use('/active-raffle', activeRaffleRoutes);
router.use('/winners', winnerRoutes);
router.use('/payment-methods', paymentMethodRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;