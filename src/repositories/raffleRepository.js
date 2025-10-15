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

      return await raffle.incrementarTicketsVendidos(cantidad);
    } catch (error) {
      throw new Error(`Error al incrementar tickets vendidos: ${error.message}`);
    }
  }
}

module.exports = new RaffleRepository();