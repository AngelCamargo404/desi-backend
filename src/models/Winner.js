// models/Winner.js - ACTUALIZADO
const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  rifa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Raffle',
    required: true
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  comprador: {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    telefono: {
      type: String,
      trim: true
    },
    estadoCiudad: {
      type: String,
      required: true,
      trim: true
    },
    cedula: {
      type: String,
      trim: true
    }
  },
  numeroTicket: {
    type: Number,
    required: true
  },
  premio: {
    type: String,
    required: true,
    trim: true
  },
  descripcionPremio: {
    type: String,
    trim: true
  },
  valorPremio: {
    type: Number,
    default: null
  },
  posicionPremio: {
    type: Number,
    required: true,
    default: 1
  },
  esGanadorPrincipal: {
    type: Boolean,
    default: false
  },
  seleccionadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fechaSorteo: {
    type: Date,
    default: Date.now
  },
  entregado: {
    type: Boolean,
    default: false
  },
  fechaEntrega: {
    type: Date,
    default: null
  },
  notasEntrega: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
winnerSchema.index({ rifa: 1 });
winnerSchema.index({ ticket: 1 }, { unique: true });
winnerSchema.index({ 'comprador.email': 1 });
winnerSchema.index({ numeroTicket: 1 });
winnerSchema.index({ esGanadorPrincipal: 1 });
winnerSchema.index({ posicionPremio: 1 });

// Método virtual para información pública
winnerSchema.methods.obtenerInfoPublica = function() {
  return {
    id: this._id,
    rifa: this.rifa,
    ticket: this.ticket,
    comprador: this.comprador,
    numeroTicket: this.numeroTicket,
    premio: this.premio,
    descripcionPremio: this.descripcionPremio,
    valorPremio: this.valorPremio,
    posicionPremio: this.posicionPremio,
    esGanadorPrincipal: this.esGanadorPrincipal,
    fechaSorteo: this.fechaSorteo,
    entregado: this.entregado,
    fechaEntrega: this.fechaEntrega,
    notasEntrega: this.notasEntrega
  };
};

module.exports = mongoose.model('Winner', winnerSchema);