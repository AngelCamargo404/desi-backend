// repositories/activeRaffleRepository.js - SIMPLIFICADO
const ActiveRaffle = require('../models/ActiveRaffle');
const Raffle = require('../models/Raffle');

class ActiveRaffleRepository {
  // Obtener rifa activa actual
  async obtenerRifaActiva() {
    try {
      return await ActiveRaffle.obtenerRifaActiva();
    } catch (error) {
      throw new Error(`Error al obtener rifa activa: ${error.message}`);
    }
  }

  // Obtener información completa de la rifa activa
  async obtenerRifaActivaConInfo() {
    try {
      const activeRaffle = await ActiveRaffle.findOne()
        .populate('raffleId')
        .populate('activadoPor', 'nombre email')
        .sort({ activadoEn: -1 });

      return activeRaffle;
    } catch (error) {
      throw new Error(`Error al obtener información de rifa activa: ${error.message}`);
    }
  }

  // Activar una rifa (reemplaza cualquier existente)
  async activarRifa(raffleId, userId) {
    try {
      // Verificar que la rifa existe
      const raffle = await Raffle.findById(raffleId);
      if (!raffle) {
        throw new Error('La rifa no existe');
      }

      return await ActiveRaffle.activarRifa(raffleId, userId);
    } catch (error) {
      throw new Error(`Error al activar rifa: ${error.message}`);
    }
  }

  // Desactivar todas las rifas
  async desactivarTodas() {
    try {
      return await ActiveRaffle.deleteMany({});
    } catch (error) {
      throw new Error(`Error al desactivar rifas: ${error.message}`);
    }
  }

  // Verificar si una rifa específica está activa
  async esRifaActiva(raffleId) {
    try {
      const activeRaffle = await ActiveRaffle.findOne({ raffleId });
      return !!activeRaffle;
    } catch (error) {
      throw new Error(`Error al verificar rifa activa: ${error.message}`);
    }
  }
}

module.exports = new ActiveRaffleRepository();