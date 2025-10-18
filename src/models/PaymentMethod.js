// models/PaymentMethod.js - SIMPLIFICADO
const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    enum: ['transferencia', 'pago_movil', 'zelle', 'binance']
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  // Campos específicos para cada método
  datos: {
    type: Map,
    of: String,
    required: true
  },
  requiereComprobante: {
    type: Boolean,
    default: true
  },
  requiereReferencia: {
    type: Boolean,
    default: true
  },
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
paymentMethodSchema.index({ codigo: 1 }, { unique: true });
paymentMethodSchema.index({ activo: 1 });
paymentMethodSchema.index({ orden: 1 });

// Método para obtener datos públicos
paymentMethodSchema.methods.obtenerDatosPublicos = function() {
  // Filtrar solo los datos que tienen valor
  const datosFiltrados = {};
  for (const [key, value] of this.datos) {
    if (value && value.trim() !== '') {
      datosFiltrados[key] = value;
    }
  }

  return {
    id: this._id,
    codigo: this.codigo,
    nombre: this.nombre,
    datos: datosFiltrados,
    requiereComprobante: this.requiereComprobante,
    requiereReferencia: this.requiereReferencia
  };
};

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);