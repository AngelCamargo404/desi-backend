const ticketRepository = require('../repositories/ticketRepository');
const paymentService = require('../services/paymentService');

class TicketController {
  // Comprar ticket (actualizado para manejar archivos)
  async comprarTicket(req, res) {
    try {
      const { id } = req.params;
      const datosCompra = JSON.parse(req.body.datosCompra || '{}');
      const archivoComprobante = req.file;

      // Validar datos requeridos para la compra
      if (!datosCompra.comprador || !datosCompra.comprador.nombre || 
          !datosCompra.comprador.email || !datosCompra.comprador.estadoCiudad) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y estado/ciudad del comprador son requeridos'
        });
      }

      // Validar método de pago
      if (!datosCompra.metodoPago) {
        return res.status(400).json({
          success: false,
          message: 'El método de pago es requerido'
        });
      }

      // Validar que se envió comprobante para métodos que lo requieren
      const requiereComprobante = paymentService.requiereReferencia(datosCompra.metodoPago);
      if (requiereComprobante && !archivoComprobante) {
        return res.status(400).json({
          success: false,
          message: 'El comprobante de pago es requerido para este método de pago'
        });
      }

      const metodosPermitidos = await ticketRepository.obtenerMetodosPago();
      if (!metodosPermitidos.includes(datosCompra.metodoPago)) {
        return res.status(400).json({
          success: false,
          message: `Método de pago no válido. Los métodos permitidos son: ${metodosPermitidos.join(', ')}`
        });
      }

      const ticket = await ticketRepository.comprarTicket(id, datosCompra, archivoComprobante);

      res.json({
        success: true,
        message: 'Ticket comprado exitosamente',
        data: ticket
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Nuevo método: Obtener tickets por estado/ciudad
  async obtenerTicketsPorEstadoCiudad(req, res) {
    try {
      const { estadoCiudad } = req.params;
      const { pagina, limite } = req.query;
      
      const resultado = await ticketRepository.obtenerPorEstadoCiudad(
        estadoCiudad,
        parseInt(pagina) || 1,
        parseInt(limite) || 10
      );

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Nuevo método: Verificar ticket
  async verificarTicket(req, res) {
    try {
      const { id } = req.params;
      const { verificadoPor } = req.body;

      if (!verificadoPor) {
        return res.status(400).json({
          success: false,
          message: 'El campo verificadoPor es requerido'
        });
      }

      const ticket = await ticketRepository.verificarTicket(id, verificadoPor);

      res.json({
        success: true,
        message: 'Ticket verificado exitosamente',
        data: ticket
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Nuevo método: Obtener tickets no verificados
  async obtenerTicketsNoVerificados(req, res) {
    try {
      const { pagina, limite } = req.query;
      
      const resultado = await ticketRepository.obtenerNoVerificados(
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

  // Nuevo método: Actualizar comprobante
  async actualizarComprobante(req, res) {
    try {
      const { id } = req.params;
      const archivoComprobante = req.file;

      if (!archivoComprobante) {
        return res.status(400).json({
          success: false,
          message: 'El archivo de comprobante es requerido'
        });
      }

      const ticket = await ticketRepository.actualizarComprobante(id, archivoComprobante);

      res.json({
        success: true,
        message: 'Comprobante actualizado exitosamente',
        data: ticket
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new TicketController();