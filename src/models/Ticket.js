const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  numero: {
    type: Number,
    required: true,
    min: 1
  },
  rifa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Raffle',
    required: true
  },
  comprador: {
    nombre: {
      type: String,
      required: false, // CAMBIADO: No requerido
      trim: true,
      default: '' // Agregar valor por defecto
    },
    email: {
      type: String,
      required: false, // CAMBIADO: No requerido
      trim: true,
      lowercase: true,
      default: '' // Agregar valor por defecto
    },
    telefono: {
      type: String,
      trim: true,
      default: '' // Agregar valor por defecto
    },
    estadoCiudad: {
      type: String,
      required: false, // CAMBIADO: No requerido
      trim: true,
      default: '' // Agregar valor por defecto
    },
    cedula: {
      type: String,
      trim: true,
      default: '' // Agregar valor por defecto
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
    required: true,
    trim: true,
    index: true
  },
  referenciaPago: {
    type: String,
    trim: true,
    default: '' // Agregar valor por defecto
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
    trim: true,
    default: '' // Agregar valor por defecto
  },
  // NUEVO CAMPO: Datos de cancelación
  datosCancelacion: {
    transaccionIdOriginal: {
      type: String,
      trim: true
    },
    comprador: {
      nombre: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      telefono: {
        type: String,
        trim: true
      },
      estadoCiudad: {
        type: String,
        trim: true
      },
      cedula: {
        type: String,
        trim: true
      }
    },
    metodoPago: {
      type: String,
      enum: ['transferencia', 'pago_movil', 'zelle', 'binance', null]
    },
    referenciaPago: {
      type: String,
      trim: true
    },
    fechaCompra: {
      type: Date
    },
    verificado: {
      type: Boolean
    },
    fechaVerificacion: {
      type: Date
    },
    verificadoPor: {
      type: String,
      trim: true
    },
    razon: {
      type: String,
      trim: true
    },
    fechaCancelacion: {
      type: Date
    },
    canceladoPor: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Los índices, métodos estáticos y de instancia se mantienen igual...
ticketSchema.index({ rifa: 1, numero: 1 }, { unique: true });
ticketSchema.index({ codigo: 1 });
ticketSchema.index({ 'comprador.email': 1 });
ticketSchema.index({ estado: 1 });
ticketSchema.index({ fechaCompra: 1 });
ticketSchema.index({ metodoPago: 1 });
ticketSchema.index({ 'comprador.estadoCiudad': 1 });
ticketSchema.index({ verificado: 1 });
ticketSchema.index({ transaccionId: 1 });
// NUEVO ÍNDICE para búsquedas de cancelaciones
ticketSchema.index({ 'datosCancelacion.transaccionIdOriginal': 1 });

ticketSchema.statics.verificarDisponibilidad = async function(rifaId, numero) {
  const ticket = await this.findOne({ 
    rifa: rifaId, 
    numero,
    // Considerar NO disponibles solo los tickets vendidos/reservados SIN cancelar
    $and: [
      {
        $or: [
          { estado: 'vendido' },
          { estado: 'reservado' }
        ]
      },
      {
        datosCancelacion: { $exists: false }
      }
    ]
  });
  
  return !ticket; // true = disponible, false = ocupado
};

ticketSchema.statics.obtenerNumerosOcupados = async function(rifaId) {
  // Solo devolver números de tickets que estén VENDIDOS (no disponibles o cancelados)
  const tickets = await this.find({ 
    rifa: rifaId, 
    estado: 'vendido'  // SOLO tickets vendidos, no los disponibles
  }, 'numero');
  
  return tickets.map(ticket => ticket.numero);
};

ticketSchema.statics.obtenerTodosLosNumerosConEstado = async function(rifaId) {
  const tickets = await this.find({ rifa: rifaId }, 'numero estado');
  
  return tickets.map(ticket => ({
    numero: ticket.numero,
    estado: ticket.estado,
    disponible: ticket.estado === 'disponible'
  }));
};

// Método para obtener tickets agrupados por transacción
ticketSchema.statics.obtenerComprasPorRifa = async function(rifaId, filtros = {}, pagina = 1, limite = 10) {
  try {
    const skip = (pagina - 1) * limite;
    
    // Construir query base
    const query = { 
      rifa: new mongoose.Types.ObjectId(rifaId),
      estado: 'vendido'
    };
    
    if (filtros.verificado !== undefined) {
      query.verificado = filtros.verificado === 'true';
    }

    console.log('🔍 Query para compras:', { rifaId, filtros, pagina, limite });

    // Agrupar por transaccionId con mejor estructura
    const compras = await this.aggregate([
      { $match: query },
      {
        $sort: {
          transaccionId: 1,
          numero: 1
        }
      },
      {
        $group: {
          _id: "$transaccionId",
          transaccionId: { $first: "$transaccionId" },
          comprador: { $first: "$comprador" },
          metodoPago: { $first: "$metodoPago" },
          referenciaPago: { $first: "$referenciaPago" },
          comprobante: { $first: "$comprobante" },
          fechaCompra: { $first: "$fechaCompra" },
          verificado: { $first: "$verificado" },
          fechaVerificacion: { $first: "$fechaVerificacion" },
          verificadoPor: { $first: "$verificadoPor" },
          cantidadTickets: { $sum: 1 },
          numerosTickets: { 
            $push: {
              $toString: "$numero"
            }
          },
          ticketsIds: { $push: "$_id" },
          // Información adicional útil
          primerTicket: { $first: "$numero" },
          ultimoTicket: { $last: "$numero" }
        }
      },
      {
        $project: {
          _id: 0,
          transaccionId: 1,
          comprador: 1,
          metodoPago: 1,
          referenciaPago: 1,
          comprobante: 1,
          fechaCompra: 1,
          verificado: 1,
          fechaVerificacion: 1,
          verificadoPor: 1,
          cantidadTickets: 1,
          numerosTickets: 1,
          ticketsIds: 1,
          primerTicket: 1,
          ultimoTicket: 1
        }
      },
      { $sort: { fechaCompra: -1 } },
      { $skip: skip },
      { $limit: parseInt(limite) }
    ]);

    // Obtener el total de transacciones únicas de manera más eficiente
    const totalResult = await this.aggregate([
      { $match: query },
      { $group: { _id: "$transaccionId" } },
      { $count: "total" }
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    console.log('📊 Resultado compras agrupadas:', {
      comprasEncontradas: compras.length,
      totalTransacciones: total,
      pagina,
      limite
    });

    return {
      compras,
      paginaActual: parseInt(pagina),
      totalPaginas: Math.ceil(total / limite),
      totalCompras: total,
      hasNext: pagina < Math.ceil(total / limite),
      hasPrev: pagina > 1
    };
  } catch (error) {
    console.error('❌ Error en obtenerComprasPorRifa:', error);
    throw new Error(`Error al obtener compras por rifa: ${error.message}`);
  }
};

// NUEVO MÉTODO: Obtener compras canceladas
ticketSchema.statics.obtenerComprasCanceladasPorRifa = async function(rifaId, pagina = 1, limite = 10) {
  try {
    const skip = (pagina - 1) * limite;
    
    // Buscar tickets que tengan datosCancelacion (lo que indica que fueron cancelados)
    const query = { 
      rifa: rifaId,
      'datosCancelacion': { $exists: true, $ne: null }
    };

    const ticketsCancelados = await this.find(query)
      .sort({ 'datosCancelacion.fechaCancelacion': -1 })
      .skip(skip)
      .limit(limite);

    // Agrupar por transaccionId original de la cancelación
    const comprasAgrupadas = {};
    
    ticketsCancelados.forEach(ticket => {
      const transaccionIdOriginal = ticket.datosCancelacion.transaccionIdOriginal;
      
      if (!comprasAgrupadas[transaccionIdOriginal]) {
        comprasAgrupadas[transaccionIdOriginal] = {
          transaccionIdOriginal: transaccionIdOriginal,
          transaccionIdCancelacion: ticket.transaccionId,
          comprador: ticket.datosCancelacion.comprador,
          metodoPago: ticket.datosCancelacion.metodoPago,
          referenciaPago: ticket.datosCancelacion.referenciaPago,
          fechaCompra: ticket.datosCancelacion.fechaCompra,
          fechaCancelacion: ticket.datosCancelacion.fechaCancelacion,
          razon: ticket.datosCancelacion.razon,
          canceladoPor: ticket.datosCancelacion.canceladoPor,
          tickets: [],
          cantidadTickets: 0,
          numerosTickets: []
        };
      }
      
      comprasAgrupadas[transaccionIdOriginal].tickets.push({
        _id: ticket._id,
        numero: ticket.numero,
        codigo: ticket.codigo,
        precio: ticket.precio
      });
      
      comprasAgrupadas[transaccionIdOriginal].cantidadTickets++;
      comprasAgrupadas[transaccionIdOriginal].numerosTickets.push(ticket.numero);
    });

    const comprasArray = Object.values(comprasAgrupadas)
      .sort((a, b) => new Date(b.fechaCancelacion) - new Date(a.fechaCancelacion));

    const total = await this.countDocuments(query);

    return {
      compras: comprasArray,
      paginaActual: pagina,
      totalPaginas: Math.ceil(total / limite),
      totalCompras: comprasArray.length,
      hasNext: pagina < Math.ceil(total / limite),
      hasPrev: pagina > 1
    };
  } catch (error) {
    throw new Error(`Error al obtener compras canceladas: ${error.message}`);
  }
};

// Los demás métodos se mantienen...
ticketSchema.statics.generarCodigo = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};

ticketSchema.methods.marcarComoVerificado = function(verificadoPor) {
  this.verificado = true;
  this.fechaVerificacion = new Date();
  this.verificadoPor = verificadoPor;
};

module.exports = mongoose.model('Ticket', ticketSchema);