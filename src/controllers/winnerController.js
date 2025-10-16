// controllers/winnerController.js
const winnerRepository = require('../repositories/winnerRepository');

class WinnerController {
  // Seleccionar ganador aleatorio
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

  // Obtener ganadores por rifa
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

    // Actualizar estado de entrega
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