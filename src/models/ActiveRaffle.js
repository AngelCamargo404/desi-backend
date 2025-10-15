// models/ActiveRaffle.js - SIMPLIFICADO
const mongoose = require('mongoose');

const activeRaffleSchema = new mongoose.Schema({
  raffleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Raffle',
    required: true
  },
  activadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activadoEn: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Garantizar que solo haya un documento
activeRaffleSchema.statics.obtenerRifaActiva = async function() {
  let activeRaffle = await this.findOne().populate('raffleId');
  
  if (!activeRaffle) {
    // Si no hay rifa activa, buscar la primera rifa activa en el sistema
    const Raffle = mongoose.model('Raffle');
    const rifaActiva = await Raffle.findOne({ estado: 'activa' }).sort({ createdAt: -1 });
    
    if (rifaActiva) {
      // Crear registro de rifa activa automáticamente
      activeRaffle = new this({
        raffleId: rifaActiva._id,
        activadoPor: rifaActiva.creadoPor // Usar el creador de la rifa
      });
      await activeRaffle.save();
      await activeRaffle.populate('raffleId');
    }
  }
  
  return activeRaffle ? activeRaffle.raffleId : null;
};

// Activar una rifa (reemplaza cualquier rifa activa existente)
activeRaffleSchema.statics.activarRifa = async function(raffleId, userId) {
  // Eliminar cualquier rifa activa anterior
  await this.deleteMany({});
  
  // Crear nueva rifa activa
  const activeRaffle = new this({
    raffleId,
    activadoPor: userId
  });
  
  return await activeRaffle.save();
};

module.exports = mongoose.model('ActiveRaffle', activeRaffleSchema);