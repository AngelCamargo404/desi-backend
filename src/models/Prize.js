// models/Prize.js
const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del premio es requerido'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción del premio es requerida'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  posicion: {
    type: Number,
    required: [true, 'La posición del premio es requerida'],
    min: [1, 'La posición debe ser al menos 1']
  },
  valor: {
    type: Number,
    required: false,
    min: [0, 'El valor no puede ser negativo']
  },
  rifa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Raffle',
    required: [true, 'La rifa del premio es requerida']
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
    enum: ['activo', 'inactivo', 'asignado'],
    default: 'activo'
  },
  ticketGanador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    default: null
  },
  fechaAsignacion: {
    type: Date,
    default: null
  },
  condiciones: {
    type: String,
    trim: true,
    maxlength: [500, 'Las condiciones no pueden exceder 500 caracteres']
  }
}, {
  timestamps: true
});

// Índices para mejor performance
prizeSchema.index({ rifa: 1 });
prizeSchema.index({ posicion: 1 });
prizeSchema.index({ estado: 1 });
prizeSchema.index({ ticketGanador: 1 });
prizeSchema.index({ rifa: 1, posicion: 1 }, { unique: true }); // Premio único por posición en cada rifa

// Método virtual para verificar si el premio está asignado
prizeSchema.virtual('estaAsignado').get(function() {
  return this.estado === 'asignado' && this.ticketGanador !== null;
});

// Método para asignar ganador
prizeSchema.methods.asignarGanador = async function(ticketId) {
  if (this.estaAsignado) {
    throw new Error('Este premio ya ha sido asignado');
  }
  
  this.estado = 'asignado';
  this.ticketGanador = ticketId;
  this.fechaAsignacion = new Date();
  
  return await this.save();
};

// Método para desasignar ganador
prizeSchema.methods.desasignarGanador = async function() {
  this.estado = 'activo';
  this.ticketGanador = null;
  this.fechaAsignacion = null;
  
  return await this.save();
};

// Método para obtener información pública
prizeSchema.methods.obtenerInfoPublica = function() {
  return {
    id: this._id,
    nombre: this.nombre,
    descripcion: this.descripcion,
    posicion: this.posicion,
    valor: this.valor,
    rifa: this.rifa,
    imagen: this.imagen,
    estado: this.estado,
    condiciones: this.condiciones,
    estaAsignado: this.estaAsignado,
    fechaAsignacion: this.fechaAsignacion
  };
};

// Método para obtener información completa (incluye ganador)
prizeSchema.methods.obtenerInfoCompleta = async function() {
  await this.populate('ticketGanador', 'codigo comprador.nombre comprador.email');
  await this.populate('rifa', 'titulo');
  
  return {
    id: this._id,
    nombre: this.nombre,
    descripcion: this.descripcion,
    posicion: this.posicion,
    valor: this.valor,
    rifa: {
      id: this.rifa._id,
      titulo: this.rifa.titulo
    },
    imagen: this.imagen,
    estado: this.estado,
    condiciones: this.condiciones,
    estaAsignado: this.estaAsignado,
    fechaAsignacion: this.fechaAsignacion,
    ganador: this.ticketGanador ? {
      ticketId: this.ticketGanador._id,
      codigo: this.ticketGanador.codigo,
      nombre: this.ticketGanador.comprador.nombre,
      email: this.ticketGanador.comprador.email
    } : null
  };
};

// Middleware para validar posición única por rifa
prizeSchema.pre('save', async function(next) {
  if (this.isModified('posicion') || this.isModified('rifa')) {
    const existingPrize = await mongoose.model('Prize').findOne({
      rifa: this.rifa,
      posicion: this.posicion,
      _id: { $ne: this._id }
    });
    
    if (existingPrize) {
      return next(new Error(`Ya existe un premio en la posición ${this.posicion} para esta rifa`));
    }
  }
  next();
});

// Asegurar que los campos virtuals se incluyan en JSON
prizeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Prize', prizeSchema);