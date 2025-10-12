const Ticket = require('../models/Ticket');
const fileService = require('../services/fileService');

class TicketRepository {
  // Crear un nuevo ticket (actualizado)
  async crearTicket(ticketData) {
    try {
      // Generar código único
      let codigoUnico = false;
      let codigo;
      
      while (!codigoUnico) {
        codigo = Ticket.generarCodigo();
        const existe = await Ticket.findOne({ codigo });
        if (!existe) {
          codigoUnico = true;
        }
      }

      const ticket = new Ticket({
        ...ticketData,
        codigo
      });

      return await ticket.save();
    } catch (error) {
      throw new Error(`Error al crear ticket: ${error.message}`);
    }
  }

  // Comprar ticket (actualizado con nuevos campos)
  async comprarTicket(id, datosCompra, archivoComprobante = null) {
    try {
      const ticket = await Ticket.findById(id);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      if (!ticket.estaDisponible()) {
        throw new Error('El ticket no está disponible para compra');
      }

      // Procesar comprobante si se proporciona
      let comprobante = null;
      if (archivoComprobante) {
        comprobante = await fileService.procesarComprobante(archivoComprobante);
      }

      const datosCompraCompletos = {
        ...datosCompra,
        comprobante: comprobante
      };

      ticket.marcarComoVendido(datosCompraCompletos);
      return await ticket.save();
    } catch (error) {
      // Si hay error, eliminar el comprobante subido
      if (archivoComprobante) {
        try {
          await fileService.eliminarComprobanteCloudinary(archivoComprobante.public_id);
        } catch (deleteError) {
          console.error('Error eliminando comprobante:', deleteError);
        }
      }
      throw new Error(`Error al comprar ticket: ${error.message}`);
    }
  }

  // ... (mantener todos los otros métodos existentes)

  // Nuevo método: Obtener tickets por estado/ciudad
  async obtenerPorEstadoCiudad(estadoCiudad, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      const tickets = await Ticket.find({ 
        'comprador.estadoCiudad': new RegExp(estadoCiudad, 'i')
      })
        .sort({ fechaCompra: -1 })
        .skip(skip)
        .limit(limite);

      const total = await Ticket.countDocuments({ 
        'comprador.estadoCiudad': new RegExp(estadoCiudad, 'i')
      });

      return {
        tickets,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalTickets: total,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener tickets por estado/ciudad: ${error.message}`);
    }
  }

  // Nuevo método: Verificar ticket (marcar como verificado)
  async verificarTicket(id, verificadoPor) {
    try {
      const ticket = await Ticket.findById(id);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      ticket.marcarComoVerificado(verificadoPor);
      return await ticket.save();
    } catch (error) {
      throw new Error(`Error al verificar ticket: ${error.message}`);
    }
  }

  // Nuevo método: Obtener tickets no verificados
  async obtenerNoVerificados(pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      const tickets = await Ticket.find({ 
        estado: 'vendido',
        verificado: false 
      })
        .sort({ fechaCompra: 1 })
        .skip(skip)
        .limit(limite);

      const total = await Ticket.countDocuments({ 
        estado: 'vendido',
        verificado: false 
      });

      return {
        tickets,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalTickets: total,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener tickets no verificados: ${error.message}`);
    }
  }

  // Nuevo método: Actualizar comprobante
  async actualizarComprobante(id, archivoComprobante) {
    try {
      const comprobante = await fileService.procesarComprobante(archivoComprobante);
      
      const ticket = await Ticket.findByIdAndUpdate(
        id,
        { comprobante },
        { new: true, runValidators: true }
      );

      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      return ticket;
    } catch (error) {
      throw new Error(`Error al actualizar comprobante: ${error.message}`);
    }
  }
}

module.exports = new TicketRepository();