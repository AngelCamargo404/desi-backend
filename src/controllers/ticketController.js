const Ticket = require('../models/Ticket.js');
const raffleRepository = require('../repositories/raffleRepository.js');
const ticketRepository = require('../repositories/ticketRepository.js');
const emailService = require('../services/emailService.js');
const paymentService = require('../services/paymentService.js');

class TicketController {

   async obtenerTicketsPorRifa(req, res) {
    try {
      const { rifaId } = req.params;
      const { pagina, limite, estado, verificado } = req.query;
      
      const resultado = await ticketRepository.obtenerPorRifa(
        rifaId,
        { estado, verificado },
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

  async obtenerNumerosOcupados(req, res) {
    try {
      const { rifaId } = req.params;
      
      const numerosOcupados = await ticketRepository.obtenerNumerosOcupados(rifaId);
      
      res.json({
        success: true,
        data: numerosOcupados
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Comprar ticket (actualizado para manejar archivos)
  async comprarTicket(req, res) {
    try {
      console.log('🔍 Solicitud de compra recibida');
      
      const { rifaId } = req.body;
      const datosCompra = JSON.parse(req.body.datosCompra || '{}');
      const archivoComprobante = req.file;

      // Validaciones (se mantienen igual)
      if (!datosCompra.comprador || !datosCompra.comprador.nombre || 
          !datosCompra.comprador.email || !datosCompra.comprador.estadoCiudad) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y estado/ciudad del comprador son requeridos'
        });
      }

      if (!datosCompra.metodoPago) {
        return res.status(400).json({
          success: false,
          message: 'El método de pago es requerido'
        });
      }

      if (!datosCompra.numerosTickets || !Array.isArray(datosCompra.numerosTickets) || datosCompra.numerosTickets.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar al menos un número de ticket'
        });
      }

      const numerosUnicos = [...new Set(datosCompra.numerosTickets)];
      if (numerosUnicos.length !== datosCompra.numerosTickets.length) {
        return res.status(400).json({
          success: false,
          message: 'No puede seleccionar números duplicados'
        });
      }

      if (!paymentService.validarMetodoPago(datosCompra.metodoPago)) {
        return res.status(400).json({
          success: false,
          message: `Método de pago no válido. Los métodos permitidos son: ${paymentService.obtenerMetodosPagoDisponibles().join(', ')}`
        });
      }

      const requiereComprobante = paymentService.requiereComprobante(datosCompra.metodoPago);
      if (requiereComprobante && !archivoComprobante) {
        return res.status(400).json({
          success: false,
          message: 'El comprobante de pago es requerido para este método de pago'
        });
      }

      const resultado = await ticketRepository.comprarTickets(
        rifaId, 
        datosCompra, 
        datosCompra.numerosTickets, 
        archivoComprobante
      );

      res.json({
        success: true,
        message: `Se compraron ${resultado.tickets.length} ticket(s) exitosamente`,
        data: resultado.tickets,
        transaccionId: resultado.transaccionId
      });
    } catch (error) {
      console.error('❌ Error en comprarTicket:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Nuevo método: Obtener métodos de pago disponibles
  async obtenerMetodosPago(req, res) {
    try {
      const metodosPago = paymentService.obtenerTodosLosMetodosPago();
      
      res.json({
        success: true,
        data: metodosPago
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Nuevo método: Obtener información de un método de pago específico
  async obtenerInformacionMetodoPago(req, res) {
    try {
      const { metodoPago } = req.params;
      
      const informacion = paymentService.obtenerInformacionMetodoPago(metodoPago);
      
      if (!informacion) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          codigo: metodoPago,
          ...informacion
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerComprasPorRifa(req, res) {
    try {
      const { rifaId } = req.params;
      const { pagina, limite, verificado } = req.query;
      
      console.log('🔍 Obteniendo compras para rifa:', rifaId);
      console.log('📋 Parámetros:', { pagina, limite, verificado });

      // Primero verifiquemos que hay tickets
      const ticketsCount = await Ticket.countDocuments({ 
        rifa: rifaId, 
        estado: 'vendido' 
      });
      
      console.log('🎫 Total tickets vendidos en BD:', ticketsCount);

      const resultado = await ticketRepository.obtenerComprasPorRifa(
        rifaId,
        { verificado },
        parseInt(pagina) || 1,
        parseInt(limite) || 10
      );

      console.log('📦 Resultado de obtenerComprasPorRifa:', {
        comprasCount: resultado.compras ? resultado.compras.length : 0,
        totalCompras: resultado.totalCompras || 0
      });

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      console.error('❌ Error en obtenerComprasPorRifa:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Los demás métodos se mantienen igual...
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

   async verificarCompra(req, res) {
    try {
      const { transaccionId } = req.params;
      const { verificadoPor } = req.body;

      if (!verificadoPor) {
        return res.status(400).json({
          success: false,
          message: 'El campo verificadoPor es requerido'
        });
      }

      const tickets = await ticketRepository.verificarCompra(transaccionId, verificadoPor);

      // Enviar emails de confirmación para cada ticket
      for (const ticket of tickets) {
        try {
          const rifa = await raffleRepository.obtenerPorId(ticket.rifa);
          if (rifa && ticket.comprador.email) {
            await emailService.enviarTicketAprobado(ticket, rifa);
          }
        } catch (emailError) {
          console.error('Error enviando email de confirmación:', emailError);
        }
      }

      res.json({
        success: true,
        message: `Compra verificada exitosamente. ${tickets.length} ticket(s) verificados.`,
        data: tickets
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

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

      // NUEVO: Enviar email de confirmación
      try {
        console.log('📧 Intentando enviar email de confirmación...');
        
      //  Obtener información completa de la rifa
        const rifa = await raffleRepository.obtenerPorId(ticket.rifa);
        
        if (rifa && ticket.comprador.email) {
          await emailService.enviarTicketAprobado(ticket, rifa);
          console.log('✅ Email de confirmación enviado exitosamente');
        } else {
          console.warn('⚠️ No se pudo enviar el email: Rifa o email del comprador no encontrado');
        }
      } catch (emailError) {
        console.error('❌ Error enviando email de confirmación:', emailError);
      }

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

  async verificarTicketsPorEmail(req, res) {
    try {
      const { rifaId } = req.params;
      const { email } = req.query;

      console.log('🔍 Verificando tickets para:', { rifaId, email });

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro email es requerido'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del email no es válido'
        });
      }

      // Buscar tickets por rifa y email
      const tickets = await Ticket.find({
        rifa: rifaId,
        'comprador.email': email.toLowerCase(),
        estado: 'vendido'
      })
      .populate('rifa', 'titulo precioTicket ticketsTotales')
      .sort({ fechaCompra: -1, transaccionId: 1 });

      console.log(`🎫 Encontrados ${tickets.length} tickets para el email: ${email}`);

      if (tickets.length === 0) {
        return res.json({
          success: true,
          data: {
            compras: [],
            totalTickets: 0,
            totalCompras: 0,
            email: email
          }
        });
      }

      // Agrupar por transaccionId para separar las compras
      const comprasAgrupadas = {};
      
      tickets.forEach(ticket => {
        const transaccionId = ticket.transaccionId;
        
        if (!comprasAgrupadas[transaccionId]) {
          comprasAgrupadas[transaccionId] = {
            transaccionId: transaccionId,
            comprador: ticket.comprador,
            metodoPago: ticket.metodoPago,
            referenciaPago: ticket.referenciaPago,
            comprobante: ticket.comprobante,
            fechaCompra: ticket.fechaCompra,
            verificado: ticket.verificado,
            fechaVerificacion: ticket.fechaVerificacion,
            verificadoPor: ticket.verificadoPor,
            tickets: [],
            cantidadTickets: 0,
            numerosTickets: []
          };
        }
        
        comprasAgrupadas[transaccionId].tickets.push({
          _id: ticket._id,
          numero: ticket.numero,
          codigo: ticket.codigo,
          precio: ticket.precio,
          estado: ticket.estado,
          verificado: ticket.verificado,
          fechaCompra: ticket.fechaCompra,
          fechaVerificacion: ticket.fechaVerificacion
        });
        
        comprasAgrupadas[transaccionId].cantidadTickets++;
        comprasAgrupadas[transaccionId].numerosTickets.push(ticket.numero);
      });

      // Convertir a array y ordenar por fecha (más reciente primero)
      const comprasArray = Object.values(comprasAgrupadas)
        .sort((a, b) => new Date(b.fechaCompra) - new Date(a.fechaCompra));

      // Calcular estadísticas
      const totalTickets = tickets.length;
      const comprasVerificadas = comprasArray.filter(compra => compra.verificado).length;

      console.log(`📊 Resumen: ${comprasArray.length} compras, ${totalTickets} tickets, ${comprasVerificadas} verificadas`);

      res.json({
        success: true,
        data: {
          compras: comprasArray,
          totalTickets: totalTickets,
          totalCompras: comprasArray.length,
          comprasVerificadas: comprasVerificadas,
          email: email,
          rifa: tickets[0]?.rifa || null
        }
      });

    } catch (error) {
      console.error('❌ Error en verificarTicketsPorEmail:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor al verificar tickets'
      });
    }
  }

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