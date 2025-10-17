// controllers/paymentMethodController.js
const paymentMethodRepository = require('../repositories/paymentMethodRepository');

class PaymentMethodController {
  async obtenerTodos(req, res) {
    try {
      const metodosPago = await paymentMethodRepository.obtenerTodos();

      res.json({
        success: true,
        data: metodosPago
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerActivos(req, res) {
    try {
      const metodosPago = await paymentMethodRepository.obtenerActivos();

      res.json({
        success: true,
        data: metodosPago.map(metodo => metodo.obtenerDatosPublicos())
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerPorCodigo(req, res) {
    try {
      const { codigo } = req.params;
      const metodoPago = await paymentMethodRepository.obtenerPorCodigo(codigo);

      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }

      res.json({
        success: true,
        data: metodoPago
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async crear(req, res) {
    try {
      const datos = req.body;
      
      // Validar campos requeridos
      if (!datos.codigo || !datos.nombre || !datos.datos) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      const metodoPago = await paymentMethodRepository.crear(datos);

      res.status(201).json({
        success: true,
        message: 'Método de pago creado exitosamente',
        data: metodoPago
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async actualizar(req, res) {
    try {
      const { codigo } = req.params;
      const datos = req.body;
      
      const metodoPago = await paymentMethodRepository.actualizar(codigo, datos);

      res.json({
        success: true,
        message: 'Método de pago actualizado exitosamente',
        data: metodoPago
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async eliminar(req, res) {
    try {
      const { codigo } = req.params;

      await paymentMethodRepository.eliminar(codigo);

      res.json({
        success: true,
        message: 'Método de pago eliminado exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async cambiarEstado(req, res) {
    try {
      const { codigo } = req.params;
      const { activo } = req.body;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo activo es requerido y debe ser booleano'
        });
      }

      const metodoPago = await paymentMethodRepository.cambiarEstado(codigo, activo);

      res.json({
        success: true,
        message: `Método de pago ${activo ? 'activado' : 'desactivado'} exitosamente`,
        data: metodoPago
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PaymentMethodController();