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
    required: true, // NUEVO: Ahora es requerido
    trim: true,
    index: true // Índice para búsquedas rápidas
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

// Índice compuesto para evitar números duplicados en la misma rifa
ticketSchema.index({ rifa: 1, numero: 1 }, { unique: true });
ticketSchema.index({ codigo: 1 });
ticketSchema.index({ 'comprador.email': 1 });
ticketSchema.index({ estado: 1 });
ticketSchema.index({ fechaCompra: 1 });
ticketSchema.index({ metodoPago: 1 });
ticketSchema.index({ 'comprador.estadoCiudad': 1 });
ticketSchema.index({ verificado: 1 });
ticketSchema.index({ transaccionId: 1 }); // NUEVO: índice para transacciones

// Los demás métodos se mantienen igual...
ticketSchema.statics.verificarDisponibilidad = async function(rifaId, numero) {
  const ticket = await this.findOne({ rifa: rifaId, numero });
  return !ticket;
};

ticketSchema.statics.obtenerNumerosOcupados = async function(rifaId) {
  const tickets = await this.find({ rifa: rifaId }, 'numero');
  return tickets.map(ticket => ticket.numero);
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