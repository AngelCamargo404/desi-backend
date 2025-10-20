// repositories/prizeRepository.js - ACTUALIZADO con monedas múltiples
const mongoose = require('mongoose');
const Prize = require('../models/Prize');
const fileService = require('../services/fileService');

class PrizeRepository {
  // Crear nuevo premio
  async crearPrize(prizeData) {
    try {
      const prize = new Prize(prizeData);
      return await prize.save();
    } catch (error) {
      throw new Error(`Error al crear premio: ${error.message}`);
    }
  }

  // Crear múltiples premios para una rifa - ACTUALIZADO
  async crearPremiosParaRifa(rifaId, premiosData) {
    try {
      const premios = premiosData.map((premio, index) => ({
        ...premio,
        rifa: rifaId,
        posicion: index + 1
      }));

      return await Prize.insertMany(premios);
    } catch (error) {
      throw new Error(`Error al crear premios para la rifa: ${error.message}`);
    }
  }

  // Obtener premio por ID
  async obtenerPorId(id) {
    try {
      const prize = await Prize.findById(id)
        .populate('rifa', 'titulo descripcion')
        .populate('ticketGanador', 'codigo comprador.nombre comprador.email');
      
      if (!prize) {
        throw new Error('Premio no encontrado');
      }
      return prize;
    } catch (error) {
      throw new Error(`Error al obtener premio: ${error.message}`);
    }
  }

  // Obtener premios por rifa
  async obtenerPorRifa(rifaId, incluirInactivos = false) {
    try {
      const query = { rifa: rifaId };
      if (!incluirInactivos) {
        query.estado = { $ne: 'inactivo' };
      }

      const prizes = await Prize.find(query)
        .populate('ticketGanador', 'codigo comprador.nombre comprador.email')
        .sort({ posicion: 1 });

      return prizes;
    } catch (error) {
      throw new Error(`Error al obtener premios por rifa: ${error.message}`);
    }
  }

  // Obtener premio ganador por rifa y posición
  async obtenerGanadorPorRifaYPosicion(rifaId, posicion) {
    try {
      const prize = await Prize.findOne({
        rifa: rifaId,
        posicion: posicion,
        estado: 'asignado'
      }).populate('ticketGanador');

      return prize;
    } catch (error) {
      throw new Error(`Error al obtener premio ganador: ${error.message}`);
    }
  }

  // Obtener todos los premios (con paginación)
  async obtenerTodos(filtros = {}, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      const query = {};
      
      // Aplicar filtros
      if (filtros.rifa) query.rifa = filtros.rifa;
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.busqueda) {
        query.$or = [
          { nombre: { $regex: filtros.busqueda, $options: 'i' } },
          { descripcion: { $regex: filtros.busqueda, $options: 'i' } }
        ];
      }

      const prizes = await Prize.find(query)
        .populate('rifa', 'titulo')
        .populate('ticketGanador', 'codigo comprador.nombre')
        .sort({ posicion: 1 })
        .skip(skip)
        .limit(limite);

      const total = await Prize.countDocuments(query);

      return {
        prizes,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalPrizes: total,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener premios: ${error.message}`);
    }
  }

  // Actualizar premio
  async actualizarPrize(id, datosActualizacion) {
    try {
      const prize = await Prize.findByIdAndUpdate(
        id,
        { ...datosActualizacion },
        { new: true, runValidators: true }
      )
        .populate('rifa', 'titulo')
        .populate('ticketGanador', 'codigo comprador.nombre comprador.email');

      if (!prize) {
        throw new Error('Premio no encontrado');
      }

      return prize;
    } catch (error) {
      throw new Error(`Error al actualizar premio: ${error.message}`);
    }
  }

  // Eliminar premio
  async eliminarPrize(id) {
    try {
      const prize = await Prize.findByIdAndDelete(id);
      if (!prize) {
        throw new Error('Premio no encontrado');
      }
      return prize;
    } catch (error) {
      throw new Error(`Error al eliminar premio: ${error.message}`);
    }
  }

  // Asignar ganador a premio
  async asignarGanador(prizeId, ticketId) {
    try {
      const prize = await Prize.findById(prizeId);
      if (!prize) {
        throw new Error('Premio no encontrado');
      }

      return await prize.asignarGanador(ticketId);
    } catch (error) {
      throw new Error(`Error al asignar ganador: ${error.message}`);
    }
  }

  // Desasignar ganador de premio
  async desasignarGanador(prizeId) {
    try {
      const prize = await Prize.findById(prizeId);
      if (!prize) {
        throw new Error('Premio no encontrado');
      }

      return await prize.desasignarGanador();
    } catch (error) {
      throw new Error(`Error al desasignar ganador: ${error.message}`);
    }
  }

  // Actualizar imagen del premio
  async actualizarImagen(id, archivoImagen) {
    try {
      const prize = await Prize.findById(id);
      if (!prize) {
        throw new Error('Premio no encontrado');
      }

      // Si ya existe una imagen, eliminarla
      if (prize.imagen && prize.imagen.public_id) {
        try {
          if (fileService.cloudinaryConfigurado()) {
            await fileService.eliminarComprobanteCloudinary(prize.imagen.public_id);
          } else {
            await fileService.eliminarComprobanteLocal(prize.imagen.public_id);
          }
        } catch (deleteError) {
          console.error('Error eliminando imagen anterior:', deleteError);
        }
      }

      // Procesar nueva imagen
      const usarCloudinary = fileService.cloudinaryConfigurado();
      const imagen = await fileService.procesarComprobante(archivoImagen, usarCloudinary);

      prize.imagen = imagen;
      return await prize.save();
    } catch (error) {
      throw new Error(`Error al actualizar imagen: ${error.message}`);
    }
  }

  // Obtener estadísticas de premios por rifa - ACTUALIZADO para incluir monedas
  async obtenerEstadisticasPorRifa(rifaId) {
    try {
      const estadisticas = await Prize.aggregate([
        { $match: { rifa: mongoose.Types.ObjectId(rifaId) } },
        {
          $group: {
            _id: '$estado',
            cantidad: { $sum: 1 },
            totalValorUSD: { 
              $sum: { 
                $cond: [
                  { $eq: ['$moneda', 'USD'] }, 
                  { $ifNull: ['$valor', 0] }, 
                  0 
                ] 
              } 
            },
            totalValorBS: { 
              $sum: { 
                $cond: [
                  { $eq: ['$moneda', 'BS'] }, 
                  { $ifNull: ['$valorBS', 0] }, 
                  0 
                ] 
              } 
            }
          }
        }
      ]);

      const totalPremios = await Prize.countDocuments({ rifa: rifaId });
      const premiosAsignados = await Prize.countDocuments({ 
        rifa: rifaId, 
        estado: 'asignado' 
      });

      // Calcular totales por moneda
      const totalesMoneda = await Prize.aggregate([
        { $match: { rifa: mongoose.Types.ObjectId(rifaId) } },
        {
          $group: {
            _id: '$moneda',
            totalValor: { $sum: { $ifNull: ['$valor', 0] } },
            totalValorBS: { $sum: { $ifNull: ['$valorBS', 0] } },
            cantidad: { $sum: 1 }
          }
        }
      ]);

      return {
        totalPremios,
        premiosAsignados,
        premiosDisponibles: totalPremios - premiosAsignados,
        desgloseEstados: estadisticas,
        totalesPorMoneda: totalesMoneda
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Verificar si todas las posiciones están ocupadas en una rifa
  async verificarPosicionesDisponibles(rifaId) {
    try {
      const premios = await Prize.find({ rifa: rifaId }).sort({ posicion: 1 });
      const posicionesOcupadas = premios.map(p => p.posicion);
      const maxPosicion = premios.length > 0 ? Math.max(...posicionesOcupadas) : 0;
      
      const posicionesDisponibles = [];
      for (let i = 1; i <= maxPosicion; i++) {
        if (!posicionesOcupadas.includes(i)) {
          posicionesDisponibles.push(i);
        }
      }

      return {
        totalPosiciones: maxPosicion,
        posicionesOcupadas: posicionesOcupadas.length,
        posicionesDisponibles,
        tienePosicionesDisponibles: posicionesDisponibles.length > 0
      };
    } catch (error) {
      throw new Error(`Error al verificar posiciones: ${error.message}`);
    }
  }
}

module.exports = new PrizeRepository();