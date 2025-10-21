// repositories/raffleRepository.js
const Raffle = require('../models/Raffle');
const fileService = require('../services/fileService');

class RaffleRepository {
  // Crear nueva rifa
  async crearRaffle(raffleData, archivoImagen = null) {
    try {
      // Validar campos requeridos
      if (!raffleData.titulo || !raffleData.precioTicket || !raffleData.ticketsTotales || !raffleData.creadoPor) {
        throw new Error('Faltan campos requeridos: título, precioTicket, ticketsTotales, creadoPor');
      }

      let imagenData = {};
      
      if (archivoImagen) {
        const usarCloudinary = fileService.cloudinaryConfigurado();
        imagenData = await fileService.procesarImagenRifa(archivoImagen, usarCloudinary);
        imagenData.nombreOriginal = archivoImagen.originalname || '';
      }

      // Create raffle with image data
      const raffle = new Raffle({
        ...raffleData,
        imagen: imagenData
      });

      return await raffle.save();
    } catch (error) {
      throw new Error(`Error al crear rifa: ${error.message}`);
    }
  }

  // Los demás métodos se mantienen igual...
  async obtenerPorId(id) {
    try {
      const raffle = await Raffle.findById(id);
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }
      return raffle;
    } catch (error) {
      throw new Error(`Error al obtener rifa: ${error.message}`);
    }
  }

  // Obtener rifa activa principal (para el dashboard público)
  async obtenerRifaActiva() {
    try {
      const raffle = await Raffle.findOne({ estado: 'activa' })
        .sort({ createdAt: -1 });
      return raffle;
    } catch (error) {
      throw new Error(`Error al obtener rifa activa: ${error.message}`);
    }
  }

  // Obtener todas las rifas (con paginación)
  async obtenerTodas(filtros = {}, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      const query = {};
      
      // Aplicar filtros
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.busqueda) {
        query.$or = [
          { titulo: { $regex: filtros.busqueda, $options: 'i' } },
          { descripcion: { $regex: filtros.busqueda, $options: 'i' } }
        ];
      }

      const raffles = await Raffle.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite);

      const total = await Raffle.countDocuments(query);

      return {
        raffles,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalRaffles: total,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener rifas: ${error.message}`);
    }
  }

  // Actualizar rifa
  async actualizarRaffle(id, datosActualizacion) {
    try {
      // Si se actualizan premios, reasignar posiciones
      if (datosActualizacion.premios && datosActualizacion.premios.length > 0) {
        datosActualizacion.premios = datosActualizacion.premios.map((premio, index) => ({
          descripcion: premio.descripcion,
          posicion: index + 1
        }));
      }

      const raffle = await Raffle.findByIdAndUpdate(
        id,
        { ...datosActualizacion },
        { new: true, runValidators: true }
      );

      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      return raffle;
    } catch (error) {
      throw new Error(`Error al actualizar rifa: ${error.message}`);
    }
  }

  // Eliminar rifa (soft delete)
  async eliminarRaffle(id) {
    try {
      const raffle = await Raffle.findByIdAndUpdate(
        id,
        { estado: 'cancelada' },
        { new: true }
      );

      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      return raffle;
    } catch (error) {
      throw new Error(`Error al eliminar rifa: ${error.message}`);
    }
  }

  // Actualizar imagen de la rifa
  async actualizarImagen(id, archivoImagen) {
    try {
      const raffle = await Raffle.findById(id);
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      // Si ya existe una imagen, eliminarla
      if (raffle.imagen && raffle.imagen.public_id) {
        try {
          if (fileService.cloudinaryConfigurado()) {
            await fileService.eliminarImagenRifaCloudinary(raffle.imagen.public_id);
          } else {
            await fileService.eliminarImagenRifaLocal(raffle.imagen.public_id);
          }
        } catch (deleteError) {
          console.error('Error eliminando imagen anterior:', deleteError);
        }
      }

      // Procesar nueva imagen usando el método específico para rifas
      const usarCloudinary = fileService.cloudinaryConfigurado();
      const imagen = await fileService.procesarImagenRifa(archivoImagen, usarCloudinary);

      raffle.imagen = imagen;
      return await raffle.save();
    } catch (error) {
      throw new Error(`Error al actualizar imagen: ${error.message}`);
    }
  }

  // Obtener estadísticas de rifas
  async obtenerEstadisticas() {
    try {
      const totalRaffles = await Raffle.countDocuments();
      const rafflesActivas = await Raffle.countDocuments({ estado: 'activa' });
      const rafflesFinalizadas = await Raffle.countDocuments({ estado: 'finalizada' });
      const totalTicketsVendidos = await Raffle.aggregate([
        { $group: { _id: null, total: { $sum: '$ticketsVendidos' } } }
      ]);

      const ultimaRaffle = await Raffle.findOne()
        .sort({ createdAt: -1 })
        .select('titulo ticketsVendidos ticketsTotales createdAt');

      return {
        totalRaffles,
        rafflesActivas,
        rafflesFinalizadas,
        totalTicketsVendidos: totalTicketsVendidos[0]?.total || 0,
        ultimaRaffleCreada: ultimaRaffle
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Incrementar tickets vendidos
  async incrementarTicketsVendidos(id, cantidad = 1) {
    try {
      const raffle = await Raffle.findById(id);
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      // Usar el método del modelo si existe, o implementar directamente
      if (typeof raffle.incrementarTicketsVendidos === 'function') {
        return await raffle.incrementarTicketsVendidos(cantidad);
      } else {
        // Implementación directa si el método no existe en el modelo
        raffle.ticketsVendidos += cantidad;
        
        // Validar que no exceda el total de tickets
        if (raffle.ticketsVendidos > raffle.ticketsTotales) {
          throw new Error('No se pueden vender más tickets del total disponible');
        }
        
        return await raffle.save();
      }
    } catch (error) {
      throw new Error(`Error al incrementar tickets vendidos: ${error.message}`);
    }
  }

  async obtenerComprasCanceladasPorRifa(rifaId, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      // Buscar tickets que tengan datosCancelacion (lo que indica que fueron cancelados)
      // y estén en estado 'disponible' (liberados)
      const query = { 
        rifa: rifaId,
        'datosCancelacion': { $exists: true, $ne: null },
        estado: 'disponible'
      };

      const ticketsCancelados = await Ticket.find(query)
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

      const total = await Ticket.countDocuments(query);

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
  }

  // NUEVO MÉTODO: Decrementar tickets vendidos (para cancelaciones)
  async decrementarTicketsVendidos(id, cantidad = 1) {
    try {
      const raffle = await Raffle.findById(id);
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      // Asegurarnos de que no decrementemos por debajo de 0
      raffle.ticketsVendidos = Math.max(0, raffle.ticketsVendidos - cantidad);
      
      // Validar integridad de los datos
      if (raffle.ticketsVendidos < 0) {
        raffle.ticketsVendidos = 0;
      }
      
      return await raffle.save();
    } catch (error) {
      throw new Error(`Error al decrementar tickets vendidos: ${error.message}`);
    }
  }

  // NUEVO MÉTODO: Obtener rifa con información extendida (tickets disponibles, etc.)
  async obtenerRifaConEstadisticas(id) {
    try {
      const raffle = await Raffle.findById(id);
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      // Calcular estadísticas adicionales
      const estadisticas = {
        ticketsDisponibles: raffle.ticketsTotales - raffle.ticketsVendidos,
        porcentajeVendido: (raffle.ticketsVendidos / raffle.ticketsTotales) * 100,
        fechaCreacion: raffle.createdAt,
        diasActiva: Math.floor((new Date() - raffle.createdAt) / (1000 * 60 * 60 * 24))
      };

      return {
        ...raffle.toObject(),
        estadisticas
      };
    } catch (error) {
      throw new Error(`Error al obtener rifa con estadísticas: ${error.message}`);
    }
  }

  // NUEVO MÉTODO: Verificar si una rifa puede aceptar más tickets
  async puedeVenderTickets(id, cantidadSolicitada = 1) {
    try {
      const raffle = await Raffle.findById(id);
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      const ticketsDisponibles = raffle.ticketsTotales - raffle.ticketsVendidos;
      return {
        puedeVender: ticketsDisponibles >= cantidadSolicitada,
        ticketsDisponibles,
        ticketsSolicitados: cantidadSolicitada,
        mensaje: ticketsDisponibles >= cantidadSolicitada 
          ? `Hay ${ticketsDisponibles} tickets disponibles` 
          : `Solo hay ${ticketsDisponibles} tickets disponibles, se solicitaron ${cantidadSolicitada}`
      };
    } catch (error) {
      throw new Error(`Error al verificar disponibilidad de tickets: ${error.message}`);
    }
  }
}

module.exports = new RaffleRepository();