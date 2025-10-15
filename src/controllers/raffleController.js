// controllers/raffleController.js
const raffleRepository = require('../repositories/raffleRepository');

class RaffleController {
  // Crear nueva rifa
  async crearRaffle(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Solo recibir datos de la rifa, no premios
      const raffleData = {
        ...req.body,
        creadoPor: req.user._id
      };
      
      const archivoImagen = req.file;
      
      const raffle = await raffleRepository.crearRaffle(raffleData, archivoImagen);

      res.status(201).json({
        success: true,
        message: 'Rifa creada exitosamente',
        data: raffle.obtenerInfoPublica()
      });
    } catch (error) {
      console.error('Error en crearRaffle:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Los demás métodos del controlador se mantienen igual...
  async obtenerRaffle(req, res) {
    try {
      const { id } = req.params;
      const raffle = await raffleRepository.obtenerPorId(id);

      res.json({
        success: true,
        data: raffle.obtenerInfoPublica()
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerRifaActiva(req, res) {
    try {
      const raffle = await raffleRepository.obtenerRifaActiva();

      if (!raffle) {
        return res.status(404).json({
          success: false,
          message: 'No hay rifas activas en este momento'
        });
      }

      res.json({
        success: true,
        data: raffle.obtenerInfoPublica()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener todas las rifas
  async obtenerRaffles(req, res) {
    try {
      const { pagina, limite, estado, busqueda } = req.query;
      console.log(pagina, limite, estado, busqueda);
      
      const resultado = await raffleRepository.obtenerTodas(
        { estado, busqueda },
        parseInt(pagina) || 1,
        parseInt(limite) || 10
      );

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar rifa
  async actualizarRaffle(req, res) {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      // Parsear premios si vienen como string
      if (datosActualizacion.premios && typeof datosActualizacion.premios === 'string') {
        datosActualizacion.premios = JSON.parse(datosActualizacion.premios);
      }

      const raffle = await raffleRepository.actualizarRaffle(id, datosActualizacion);

      res.json({
        success: true,
        message: 'Rifa actualizada exitosamente',
        data: raffle.obtenerInfoPublica()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Eliminar rifa
  async eliminarRaffle(req, res) {
    try {
      const { id } = req.params;
      await raffleRepository.eliminarRaffle(id);

      res.json({
        success: true,
        message: 'Rifa eliminada exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar imagen de la rifa
  async actualizarImagen(req, res) {
    try {
      const { id } = req.params;
      const archivoImagen = req.file;
      console.log(123213123123);
      
      if (!archivoImagen) {
        return res.status(400).json({
          success: false,
          message: 'La imagen es requerida'
        });
      }
      console.log("archivo imagen", archivoImagen);
      
      const raffle = await raffleRepository.actualizarImagen(id, archivoImagen);

      res.json({
        success: true,
        message: 'Imagen actualizada exitosamente',
        data: raffle.obtenerInfoPublica()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await raffleRepository.obtenerEstadisticas();

      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new RaffleController();