const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
    }
  },
  estado: {
    type: String,
    enum: ['disponible', 'reservado', 'vendido', 'ganador'],
    default: 'disponible'
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  fechaCompra: {
    type: Date,
    default: null
  },
  metodoPago: {
    type: String,
    enum: ['transferencia', 'pago_movil', 'zelle', 'binance', null],
    default: null
  },
  transaccionId: {
    type: String,
    trim: true
  },
  referenciaPago: {
    type: String,
    trim: true
  },
  comprobante: {
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
  // Campos de auditoría
  verificado: {
    type: Boolean,
    default: false
  },
  fechaVerificacion: {
    type: Date,
    default: null
  },
  verificadoPor: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para mejor performance
ticketSchema.index({ codigo: 1 });
ticketSchema.index({ 'comprador.email': 1 });
ticketSchema.index({ estado: 1 });
ticketSchema.index({ fechaCompra: 1 });
ticketSchema.index({ metodoPago: 1 });
ticketSchema.index({ 'comprador.estadoCiudad': 1 });
ticketSchema.index({ verificado: 1 });

// Método estático para generar código único
ticketSchema.statics.generarCodigo = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};

// Método de instancia para verificar si está disponible
ticketSchema.methods.estaDisponible = function() {
  return this.estado === 'disponible';
};

// Método de instancia para marcar como vendido
ticketSchema.methods.marcarComoVendido = function(datosCompra) {
  this.estado = 'vendido';
  this.comprador = {
    nombre: datosCompra.comprador.nombre,
    email: datosCompra.comprador.email,
    telefono: datosCompra.comprador.telefono,
    estadoCiudad: datosCompra.comprador.estadoCiudad
  };
  this.fechaCompra = new Date();
  this.metodoPago = datosCompra.metodoPago;
  this.transaccionId = datosCompra.transaccionId;
  this.referenciaPago = datosCompra.referenciaPago;
  this.comprobante = datosCompra.comprobante;
};

// Método para marcar como verificado
ticketSchema.methods.marcarComoVerificado = function(verificadoPor) {
  this.verificado = true;
  this.fechaVerificacion = new Date();
  this.verificadoPor = verificadoPor;
};

// Método estático para obtener los métodos de pago disponibles
ticketSchema.statics.obtenerMetodosPago = function() {
  return ['transferencia', 'pago_movil', 'zelle', 'binance'];
};

// Método virtual para obtener información resumida
ticketSchema.virtual('infoResumida').get(function() {
  return {
    codigo: this.codigo,
    comprador: this.comprador.nombre,
    email: this.comprador.email,
    estado: this.estado,
    precio: this.precio,
    fechaCompra: this.fechaCompra,
    verificado: this.verificado
  };
});

// Asegurar que los campos virtuals se incluyan en JSON
ticketSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema);