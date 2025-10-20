// models/Raffle.js - ACTUALIZADO con monedas múltiples
const mongoose = require('mongoose');

const raffleSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título de la rifa es requerido'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción de la rifa es requerida'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  precioTicket: {
    type: Number,
    required: [true, 'El precio del ticket es requerido'],
    min: [1, 'El precio debe ser mayor a 0']
  },
  precioTicketBS: {
    type: Number,
    required: false,
    min: [0, 'El precio en BS debe ser mayor o igual a 0']
  },
  moneda: {
    type: String,
    enum: ['USD', 'BS'],
    default: 'USD'
  },
  minTickets: {
    type: Number,
    required: true,
    min: [1, 'El mínimo de tickets debe ser al menos 1'],
    default: 1
  },
  ticketsTotales: {
    type: Number,
    required: [true, 'El total de tickets es requerido'],
    min: [1, 'El total de tickets debe ser al menos 1']
  },
  ticketsVendidos: {
    type: Number,
    default: 0
  },
  imagen: {
    url: {
      type: String,
      trim: true
    },
    public_id: {
      type: String,
      trim: true
    },
    nombreOriginal: {
      type: String,
      trim: true
    }
  },
  estado: {
    type: String,
    enum: ['activa', 'pausada', 'finalizada', 'cancelada'],
    default: 'activa'
  },
  fechaSorteo: {
    type: Date,
    required: false
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Los índices, métodos virtuales y de instancia se mantienen igual...
raffleSchema.index({ estado: 1 });
raffleSchema.index({ creadoPor: 1 });
raffleSchema.index({ fechaSorteo: 1 });

// Método virtual para calcular progreso
raffleSchema.virtual('progreso').get(function() {
  return (this.ticketsVendidos / this.ticketsTotales) * 100;
});

// Método para verificar si la rifa está activa
raffleSchema.methods.estaActiva = function() {
  return this.estado === 'activa';
};

// Método para verificar si hay tickets disponibles
raffleSchema.methods.hayTicketsDisponibles = function() {
  return this.ticketsVendidos < this.ticketsTotales;
};

// Método para incrementar tickets vendidos
raffleSchema.methods.incrementarTicketsVendidos = function(cantidad = 1) {
  if (this.ticketsVendidos + cantidad > this.ticketsTotales) {
    throw new Error('No hay suficientes tickets disponibles');
  }
  this.ticketsVendidos += cantidad;
  return this.save();
};

// Método para obtener información pública (ACTUALIZADO)
raffleSchema.methods.obtenerInfoPublica = function() {
  return {
    id: this._id,
    titulo: this.titulo,
    descripcion: this.descripcion,
    precioTicket: this.precioTicket,
    precioTicketBS: this.precioTicketBS,
    moneda: this.moneda,
    minTickets: this.minTickets,
    ticketsTotales: this.ticketsTotales,
    ticketsVendidos: this.ticketsVendidos,
    progreso: this.progreso,
    imagen: this.imagen,
    estado: this.estado,
    fechaSorteo: this.fechaSorteo
  };
};

raffleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Raffle', raffleSchema);