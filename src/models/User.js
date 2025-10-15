const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir en consultas por defecto
  },
  rol: {
    type: String,
    enum: {
      values: ['admin', 'superadmin'],
      message: 'Rol debe ser admin o superadmin'
    },
    default: 'admin'
  },
  activo: {
    type: Boolean,
    default: true
  },
  ultimoAcceso: {
    type: Date,
    default: null
  },
  configuracion: {
    tema: {
      type: String,
      enum: ['claro', 'oscuro', 'auto'],
      default: 'auto'
    },
    notificaciones: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Índices para mejor performance
userSchema.index({ email: 1 });
userSchema.index({ rol: 1 });
userSchema.index({ activo: 1 });

// Middleware para hashear password antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.compararPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Método para actualizar último acceso
userSchema.methods.actualizarUltimoAcceso = function() {
  this.ultimoAcceso = new Date();
  return this.save();
};

// Método estático para buscar por email (incluyendo password)
userSchema.statics.buscarPorEmailConPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

// Método para generar token JWT (si decides usar JWT)
userSchema.methods.generarToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      userId: this._id, // Cambiar a userId para consistencia
      email: this.email, 
      rol: this.rol 
    },
    process.env.JWT_SECRET || 'secreto_desarrollo',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Método virtual para información pública
userSchema.virtual('infoPublica').get(function() {
  return {
    id: this._id,
    nombre: this.nombre,
    email: this.email,
    rol: this.rol,
    activo: this.activo,
    ultimoAcceso: this.ultimoAcceso,
    configuracion: this.configuracion
  };
});

module.exports = mongoose.model('User', userSchema);