// controllers/activeRaffleController.js - SIMPLIFICADO
const activeRaffleRepository = require('../repositories/activeRaffleRepository');

class ActiveRaffleController {
  // Obtener la rifa activa actual (público)
  async obtenerRifaActiva(req, res) {
    try {
      const activeRaffle = await activeRaffleRepository.obtenerRifaActiva();
      
      if (!activeRaffle) {
        return res.status(404).json({
          success: false,
          message: 'No hay rifas activas en este momento'
        });
      }

      res.json({
        success: true,
        data: activeRaffle
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Activar una rifa (admin) - REEMPLAZA la rifa activa actual
  async activarRifa(req, res) {
    try {
      const { raffleId } = req.body;
      const userId = req.user._id;

      if (!raffleId) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la rifa es requerido'
        });
      }

      const activeRaffle = await activeRaffleRepository.activarRifa(raffleId, userId);

      res.json({
        success: true,
        message: 'Rifa activada exitosamente. Esta rifa ahora es la única activa en el sistema.',
        data: activeRaffle
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener información de la rifa activa (admin)
  async obtenerInfoRifaActiva(req, res) {
    try {
      const activeRaffle = await activeRaffleRepository.obtenerRifaActivaConInfo();
      
      res.json({
        success: true,
        data: activeRaffle
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Desactivar todas las rifas (admin)
  async desactivarTodas(req, res) {
    try {
      await activeRaffleRepository.desactivarTodas();
      
      res.json({
        success: true,
        message: 'Todas las rifas han sido desactivadas'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ActiveRaffleController();