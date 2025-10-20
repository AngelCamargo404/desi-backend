// controllers/prizeController.js - ACTUALIZADO con monedas múltiples
const prizeRepository = require('../repositories/prizeRepository');

class PrizeController {
  // Crear nuevo premio
  async crearPrize(req, res) {
    try {
      const prizeData = req.body;
      const prize = await prizeRepository.crearPrize(prizeData);

      res.status(201).json({
        success: true,
        message: 'Premio creado exitosamente',
        data: await prize.obtenerInfoCompleta()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Crear múltiples premios para una rifa - ACTUALIZADO
  async crearPremiosParaRifa(req, res) {
    try {
      const { rifaId } = req.params;
      const { premios } = req.body;

      if (!premios || !Array.isArray(premios)) {
        return res.status(400).json({
          success: false,
          message: 'El array de premios es requerido'
        });
      }

      // Validar que los premios tengan la estructura correcta
      const premiosValidos = premios.map((premio, index) => {
        if (!premio.nombre || !premio.descripcion) {
          throw new Error(`El premio ${index + 1} debe tener nombre y descripción`);
        }

        const premioValido = {
          nombre: premio.nombre,
          descripcion: premio.descripcion
        };

        // Solo incluir campos de valor si se proporcionan
        if (premio.moneda) {
          premioValido.moneda = premio.moneda;
        }
        if (premio.valor !== undefined && premio.valor !== null && premio.valor !== '') {
          premioValido.valor = premio.valor;
        }
        if (premio.valorBS !== undefined && premio.valorBS !== null && premio.valorBS !== '') {
          premioValido.valorBS = premio.valorBS;
        }

        return premioValido;
      });

      const premiosCreados = await prizeRepository.crearPremiosParaRifa(rifaId, premiosValidos);

      res.status(201).json({
        success: true,
        message: `${premiosCreados.length} premios creados exitosamente`,
        data: premiosCreados.map(prize => prize.obtenerInfoPublica())
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async obtenerPrize(req, res) {
    try {
      const { id } = req.params;
      const prize = await prizeRepository.obtenerPorId(id);

      res.json({
        success: true,
        data: await prize.obtenerInfoCompleta()
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener premios por rifa
  async obtenerPrizesPorRifa(req, res) {
    try {
      const { rifaId } = req.params;
      const { incluirInactivos } = req.query;

      const prizes = await prizeRepository.obtenerPorRifa(
        rifaId, 
        incluirInactivos === 'true'
      );

      res.json({
        success: true,
        data: prizes.map(prize => prize.obtenerInfoPublica())
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener todos los premios
  async obtenerPrizes(req, res) {
    try {
      const { pagina, limite, rifa, estado, busqueda } = req.query;
      
      const resultado = await prizeRepository.obtenerTodos(
        { rifa, estado, busqueda },
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

  // Actualizar premio
  async actualizarPrize(req, res) {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      const prize = await prizeRepository.actualizarPrize(id, datosActualizacion);

      res.json({
        success: true,
        message: 'Premio actualizado exitosamente',
        data: await prize.obtenerInfoCompleta()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Eliminar premio
  async eliminarPrize(req, res) {
    try {
      const { id } = req.params;
      await prizeRepository.eliminarPrize(id);

      res.json({
        success: true,
        message: 'Premio eliminado exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Asignar ganador a premio
  async asignarGanador(req, res) {
    try {
      const { id } = req.params;
      const { ticketId } = req.body;

      if (!ticketId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del ticket es requerido'
        });
      }

      const prize = await prizeRepository.asignarGanador(id, ticketId);

      res.json({
        success: true,
        message: 'Ganador asignado exitosamente al premio',
        data: await prize.obtenerInfoCompleta()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Desasignar ganador de premio
  async desasignarGanador(req, res) {
    try {
      const { id } = req.params;
      const prize = await prizeRepository.desasignarGanador(id);

      res.json({
        success: true,
        message: 'Ganador desasignado exitosamente',
        data: await prize.obtenerInfoCompleta()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar imagen del premio
  async actualizarImagen(req, res) {
    try {
      const { id } = req.params;
      const archivoImagen = req.file;

      if (!archivoImagen) {
        return res.status(400).json({
          success: false,
          message: 'La imagen es requerida'
        });
      }

      const prize = await prizeRepository.actualizarImagen(id, archivoImagen);

      res.json({
        success: true,
        message: 'Imagen del premio actualizada exitosamente',
        data: prize.obtenerInfoPublica()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener estadísticas de premios por rifa
  async obtenerEstadisticas(req, res) {
    try {
      const { rifaId } = req.params;
      const estadisticas = await prizeRepository.obtenerEstadisticasPorRifa(rifaId);

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

  // Verificar posiciones disponibles
  async verificarPosiciones(req, res) {
    try {
      const { rifaId } = req.params;
      const posiciones = await prizeRepository.verificarPosicionesDisponibles(rifaId);

      res.json({
        success: true,
        data: posiciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener premio ganador por posición
  async obtenerGanadorPorPosicion(req, res) {
    try {
      const { rifaId, posicion } = req.params;
      const prize = await prizeRepository.obtenerGanadorPorRifaYPosicion(rifaId, parseInt(posicion));

      if (!prize) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró un ganador para esta posición'
        });
      }

      res.json({
        success: true,
        data: await prize.obtenerInfoCompleta()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PrizeController();