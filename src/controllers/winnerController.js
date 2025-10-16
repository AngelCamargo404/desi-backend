// controllers/winnerController.js
const winnerRepository = require('../repositories/winnerRepository');
const prizeRepository = require('../repositories/prizeRepository');

class WinnerController {
  // Seleccionar múltiples ganadores según la cantidad de premios
  async seleccionarMultiplesGanadores(req, res) {
    try {
      const { raffleId } = req.params;
      
      // CORRECCIÓN: Usar obtenerPorRifa en lugar de obtenerPrizesPorRifa
      const premios = await prizeRepository.obtenerPorRifa(raffleId, false);
      
      if (!premios || premios.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La rifa no tiene premios configurados'
        });
      }

      const resultado = await winnerRepository.seleccionarMultiplesGanadores(
        raffleId, 
        req.user._id,
        premios
      );

      res.json({
        success: true,
        message: `${resultado.length} ganadores seleccionados exitosamente`,
        data: resultado
      });
    } catch (error) {
      console.error('Error en seleccionarMultiplesGanadores:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Los demás métodos se mantienen igual...
  async seleccionarGanadorAleatorio(req, res) {
    try {
      const { raffleId } = req.params;
      
      const resultado = await winnerRepository.seleccionarGanadorAleatorio(raffleId, req.user._id);

      res.json({
        success: true,
        message: 'Ganador seleccionado exitosamente',
        data: resultado
      });
    } catch (error) {
      console.error('Error en seleccionarGanadorAleatorio:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerGanadoresPorRifa(req, res) {
    try {
      const { raffleId } = req.params;
      
      const ganadores = await winnerRepository.obtenerGanadoresPorRifa(raffleId);

      res.json({
        success: true,
        data: ganadores
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerTodosLosGanadores(req, res) {
    try {
      const ganadores = await winnerRepository.obtenerTodosLosGanadores();
      
      res.json({
        success: true,
        data: ganadores
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async actualizarEstadoEntrega(req, res) {
    try {
      const { id } = req.params;
      const { entregado, fechaEntrega, notasEntrega } = req.body;
      
      const winner = await winnerRepository.actualizarEstadoEntrega(
        id, 
        entregado, 
        fechaEntrega, 
        notasEntrega
      );

      res.json({
        success: true,
        message: `Premio ${entregado ? 'marcado como entregado' : 'marcado como no entregado'}`,
        data: winner
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new WinnerController();