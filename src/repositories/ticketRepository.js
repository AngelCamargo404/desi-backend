// repositories/ticketRepository.js - ACTUALIZADO
const Ticket = require('../models/Ticket');
const fileService = require('../services/fileService');
const raffleRepository = require('./raffleRepository');
const { v4: uuidv4 } = require('uuid');

class TicketRepository {

  async crearTickets(ticketsData) {
    try {
      const tickets = [];
      
      for (const ticketData of ticketsData) {
        // Verificar que la rifa existe y está activa
        const rifa = await raffleRepository.obtenerPorId(ticketData.rifa);
        if (!rifa) {
          throw new Error('Rifa no encontrada');
        }
        if (!rifa.estaActiva()) {
          throw new Error('La rifa no está activa');
        }

        // Verificar que el número esté disponible
        const disponible = await Ticket.verificarDisponibilidad(ticketData.rifa, ticketData.numero);
        if (!disponible) {
          throw new Error(`El número ${ticketData.numero} no está disponible`);
        }

        // Verificar que el número esté en el rango válido
        if (ticketData.numero < 1 || ticketData.numero > rifa.ticketsTotales) {
          throw new Error(`El número ${ticketData.numero} está fuera del rango válido (1-${rifa.ticketsTotales})`);
        }

        // Generar código único
        let codigoUnico = false;
        let codigo;
        
        while (!codigoUnico) {
          codigo = Ticket.generarCodigo();
          const existe = await Ticket.findOne({ codigo });
          if (!existe) {
            codigoUnico = true;
          }
        }

        const ticket = new Ticket({
          ...ticketData,
          codigo,
          precio: rifa.precioTicket
        });

        tickets.push(ticket);
      }

      // Guardar todos los tickets
      const ticketsGuardados = await Ticket.insertMany(tickets);
      return ticketsGuardados;
    } catch (error) {
      throw new Error(`Error al crear tickets: ${error.message}`);
    }
  }

  // Crear un nuevo ticket (ACTUALIZADO para incluir rifa)
  async crearTicket(ticketData) {
    try {
      // Verificar que la rifa existe y está activa
      const rifa = await raffleRepository.obtenerPorId(ticketData.rifa);
      if (!rifa.estaActiva()) {
        throw new Error('La rifa no está activa');
      }

      // Generar código único
      let codigoUnico = false;
      let codigo;
      
      while (!codigoUnico) {
        codigo = Ticket.generarCodigo();
        const existe = await Ticket.findOne({ codigo });
        if (!existe) {
          codigoUnico = true;
        }
      }

      const ticket = new Ticket({
        ...ticketData,
        codigo,
        precio: rifa.precioTicket // Usar el precio de la rifa
      });

      return await ticket.save();
    } catch (error) {
      throw new Error(`Error al crear ticket: ${error.message}`);
    }
  }

  async comprarTickets(rifaId, datosCompra, numerosTickets, archivoComprobante = null) {
    let comprobante = null;
    
    try {
      const transaccionExistente = await Ticket.findOne({ transaccionId: datosCompra.transaccionId });
      if (transaccionExistente) {
        // Generar uno nuevo si existe
        const nuevoTransaccionId = `TXN-${uuidv4()}`;
        datosCompra.transaccionId = nuevoTransaccionId;
        console.warn('⚠️ TransaccionId duplicado detectado, generando nuevo:', nuevoTransaccionId);
      }
      
      // Verificar que la rifa existe y está activa
      const rifa = await raffleRepository.obtenerPorId(rifaId);
      if (!rifa) {
        throw new Error('Rifa no encontrada');
      }
      if (!rifa.estaActiva()) {
        throw new Error('La rifa no está activa para la venta de tickets');
      }

      // Verificar que hay suficientes tickets disponibles
      const ticketsDisponibles = rifa.ticketsTotales - rifa.ticketsVendidos;
      if (numerosTickets.length > ticketsDisponibles) {
        throw new Error(`Solo hay ${ticketsDisponibles} tickets disponibles`);
      }

      // Verificar disponibilidad de cada número
      for (const numero of numerosTickets) {
        const disponible = await Ticket.verificarDisponibilidad(rifaId, numero);
        if (!disponible) {
          throw new Error(`El número ${numero} no está disponible`);
        }
        
        if (numero < 1 || numero > rifa.ticketsTotales) {
          throw new Error(`El número ${numero} está fuera del rango válido (1-${rifa.ticketsTotales})`);
        }
      }

      // Procesar comprobante si se proporciona
      if (archivoComprobante) {
        const usarCloudinary = fileService.cloudinaryConfigurado();
        comprobante = await fileService.procesarComprobante(archivoComprobante, usarCloudinary);
      }

      // Crear datos para cada ticket con el mismo transaccionId
      const ticketsData = numerosTickets.map(numero => ({
        rifa: rifaId,
        numero: numero,
        comprador: {
          nombre: datosCompra.comprador.nombre,
          email: datosCompra.comprador.email,
          telefono: datosCompra.comprador.telefono,
          estadoCiudad: datosCompra.comprador.estadoCiudad,
          cedula: datosCompra.comprador.cedula
        },
        estado: 'vendido',
        precio: rifa.precioTicket,
        fechaCompra: new Date(),
        metodoPago: datosCompra.metodoPago,
        transaccionId: datosCompra.transaccionId,
        referenciaPago: datosCompra.referenciaPago,
        comprobante: comprobante
      }));

      // Crear todos los tickets
      const ticketsCreados = await this.crearTickets(ticketsData);

      // Incrementar contador de tickets vendidos en la rifa
      await raffleRepository.incrementarTicketsVendidos(rifaId, numerosTickets.length);

      return {
        tickets: ticketsCreados,
        transaccionId: datosCompra.transaccionId
      };
      
    } catch (error) {
      // Limpieza en caso de error
      if (comprobante) {
        try {
          if (fileService.cloudinaryConfigurado()) {
            await fileService.eliminarComprobanteCloudinary(comprobante.public_id);
          } else {
            await fileService.eliminarComprobanteLocal(comprobante.public_id);
          }
        } catch (deleteError) {
          console.error('Error eliminando comprobante:', deleteError);
        }
      }
      throw new Error(`Error al comprar tickets: ${error.message}`);
    }
  }

  // Comprar ticket (ACTUALIZADO para manejar rifa)
  async comprarTicket(rifaId, datosCompra, archivoComprobante = null) {
    let comprobante = null;
    
    try {
      const rifa = await raffleRepository.obtenerPorId(rifaId);
      if (!rifa) {
          throw new Error('Rifa no encontrada');
      }
      if (!rifa.estaActiva()) {
          throw new Error('La rifa no está activa para la venta de tickets');
      }

      // 2. Procesar comprobante si se proporciona
      if (archivoComprobante) {
          const usarCloudinary = fileService.cloudinaryConfigurado();
          comprobante = await fileService.procesarComprobante(archivoComprobante, usarCloudinary);
      }

      // 3. Generar código único para el nuevo ticket
      let codigoUnico = false;
      let codigo;
      while (!codigoUnico) {
          codigo = Ticket.generarCodigo();
          const existe = await Ticket.findOne({ codigo });
          if (!existe) {
              codigoUnico = true;
          }
      }

      // 4. Crear el NUEVO ticket
      const nuevoTicket = new Ticket({
          codigo: codigo,
          rifa: rifaId, // Asignar la rifa
          comprador: {
              nombre: datosCompra.comprador.nombre,
              email: datosCompra.comprador.email,
              telefono: datosCompra.comprador.telefono,
              estadoCiudad: datosCompra.comprador.estadoCiudad
          },
          precio: rifa.precioTicket, // Precio de la rifa
          metodoPago: datosCompra.metodoPago,
          transaccionId: datosCompra.transaccionId,
          referenciaPago: datosCompra.referenciaPago,
          comprobante: comprobante,
          estado: 'vendido' // Marcar como vendido inmediatamente
      });

      // 5. Guardar el ticket en la base de datos
      const ticketGuardado = await nuevoTicket.save();

      // 6. Incrementar contador de tickets vendidos en la rifa
      await raffleRepository.incrementarTicketsVendidos(rifaId);

      return ticketGuardado;
      
    } catch (error) {
      // Si hay error y se subió un comprobante, eliminarlo
      if (comprobante) {
        try {
          if (fileService.cloudinaryConfigurado()) {
            await fileService.eliminarComprobanteCloudinary(comprobante.public_id);
          } else {
            await fileService.eliminarComprobanteLocal(comprobante.public_id);
          }
        } catch (deleteError) {
          console.error('Error eliminando comprobante:', deleteError);
        }
      }
      throw new Error(`Error al comprar ticket: ${error.message}`);
    }
  }

  // Nuevo método: Obtener tickets por rifa
  async obtenerNumerosOcupados(rifaId) {
    try {
      return await Ticket.obtenerNumerosOcupados(rifaId);
    } catch (error) {
      throw new Error(`Error al obtener números ocupados: ${error.message}`);
    }
  }

  // Los demás métodos se mantienen igual...
  async obtenerPorRifa(rifaId, filtros = {}, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      const query = { rifa: rifaId };
      
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.verificado !== undefined) query.verificado = filtros.verificado;

      const tickets = await Ticket.find(query)
        .populate('rifa', 'titulo precioTicket')
        .sort({ numero: 1 })
        .skip(skip)
        .limit(limite);

      const total = await Ticket.countDocuments(query);

      return {
        tickets,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalTickets: total,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener tickets por rifa: ${error.message}`);
    }
  }

  // Los demás métodos se mantienen pero ahora incluyen población de rifa...
  async obtenerPorEstadoCiudad(estadoCiudad, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      const tickets = await Ticket.find({ 
        'comprador.estadoCiudad': new RegExp(estadoCiudad, 'i')
      })
        .populate('rifa', 'titulo estado') // NUEVO: poblar rifa
        .sort({ fechaCompra: -1 })
        .skip(skip)
        .limit(limite);

      const total = await Ticket.countDocuments({ 
        'comprador.estadoCiudad': new RegExp(estadoCiudad, 'i')
      });

      return {
        tickets,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalTickets: total,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener tickets por estado/ciudad: ${error.message}`);
    }
  }

  async verificarTicket(id, verificadoPor) {
    try {
      const ticket = await Ticket.findById(id).populate('rifa'); // NUEVO: populate rifa
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      ticket.marcarComoVerificado(verificadoPor);
      return await ticket.save();
    } catch (error) {
      throw new Error(`Error al verificar ticket: ${error.message}`);
    }
  }

  async obtenerComprasPorRifa(rifaId, filtros = {}, pagina = 1, limite = 10) {
    try {
      return await Ticket.obtenerComprasPorRifa(rifaId, filtros, pagina, limite);
    } catch (error) {
      throw new Error(`Error al obtener compras por rifa: ${error.message}`);
    }
  }

  async verificarCompra(transaccionId, verificadoPor) {
    try {
      const tickets = await Ticket.find({ transaccionId });
      
      if (!tickets.length) {
        throw new Error('No se encontraron tickets para esta transacción');
      }

      const resultados = [];
      for (const ticket of tickets) {
        ticket.marcarComoVerificado(verificadoPor);
        resultados.push(await ticket.save());
      }

      return resultados;
    } catch (error) {
      throw new Error(`Error al verificar la compra: ${error.message}`);
    }
  }

  // Nuevo método: Obtener tickets no verificados - MANTENIDO IGUAL
  async obtenerNoVerificados(pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      const tickets = await Ticket.find({ 
        estado: 'vendido',
        verificado: false 
      })
        .sort({ fechaCompra: 1 })
        .skip(skip)
        .limit(limite);

      const total = await Ticket.countDocuments({ 
        estado: 'vendido',
        verificado: false 
      });

      return {
        tickets,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalTickets: total,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener tickets no verificados: ${error.message}`);
    }
  }

  // Nuevo método: Actualizar comprobante - MANTENIDO IGUAL
  async actualizarComprobante(id, archivoComprobante) {
    try {
      const comprobante = await fileService.procesarComprobante(archivoComprobante);
      
      const ticket = await Ticket.findByIdAndUpdate(
        id,
        { comprobante },
        { new: true, runValidators: true }
      );

      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      return ticket;
    } catch (error) {
      throw new Error(`Error al actualizar comprobante: ${error.message}`);
    }
  }
}

module.exports = new TicketRepository();