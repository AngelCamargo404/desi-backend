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

        // Verificar que el número esté en el rango válido
        if (ticketData.numero < 1 || ticketData.numero > rifa.ticketsTotales) {
          throw new Error(`El número ${ticketData.numero} está fuera del rango válido (1-${rifa.ticketsTotales})`);
        }

        // VERIFICACIÓN MEJORADA: Buscar si ya existe un ticket (incluyendo cancelados)
        const ticketExistente = await Ticket.findOne({
          rifa: ticketData.rifa,
          numero: ticketData.numero
        });

        let ticketGuardado;

        if (ticketExistente) {
          // Si el ticket existe pero está cancelado, ACTUALIZARLO en lugar de crear uno nuevo
          if (ticketExistente.datosCancelacion) {
            
            // Actualizar el ticket existente con los nuevos datos
            ticketExistente.comprador = ticketData.comprador;
            ticketExistente.estado = 'vendido';
            ticketExistente.precio = rifa.precioTicket;
            ticketExistente.fechaCompra = new Date();
            ticketExistente.metodoPago = ticketData.metodoPago;
            ticketExistente.transaccionId = ticketData.transaccionId;
            ticketExistente.referenciaPago = ticketData.referenciaPago;
            ticketExistente.comprobante = ticketData.comprobante;
            ticketExistente.verificado = false;
            ticketExistente.fechaVerificacion = null;
            ticketExistente.verificadoPor = '';
            ticketExistente.datosCancelacion = undefined; // Remover la cancelación
            
            ticketGuardado = await ticketExistente.save();
          } else {
            // Si el ticket existe y NO está cancelado, entonces no está disponible
            throw new Error(`El número ${ticketData.numero} no está disponible`);
          }
        } else {
          // No existe ningún ticket con este número, crear uno nuevo
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

          ticketGuardado = await ticket.save();
        }

        tickets.push(ticketGuardado);
      }

      return tickets;
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

      // VERIFICACIÓN MEJORADA: Obtener solo números VENDIDOS
      const numerosOcupadosActuales = await Ticket.find({ 
        rifa: rifaId, 
        estado: 'vendido'  // ← SOLO tickets vendidos
      }).distinct('numero');
      
      // Verificar disponibilidad de cada número contra la lista actualizada
      for (const numero of numerosTickets) {
        if (numero < 1 || numero > rifa.ticketsTotales) {
          throw new Error(`El número ${numero} está fuera del rango válido (1-${rifa.ticketsTotales})`);
        }
      }

      const numerosUnicos = [...new Set(numerosTickets)];
      if (numerosUnicos.length !== numerosTickets.length) {
        throw new Error('No puedes seleccionar números duplicados');
      }

      // Resto del código igual para procesar comprobante...
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
        estado: 'vendido', // ← IMPORTANTE: Marcar como VENDIDO
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
      console.error('❌ Error en comprarTickets:', error);
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

  // En ticketRepository.js - Agregar este método
  async obtenerComprasCanceladasPorRifa(rifaId, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      // Buscar tickets que tengan datosCancelacion (lo que indica que fueron cancelados)
      const query = { 
        rifa: rifaId,
        'datosCancelacion': { $exists: true, $ne: null }
      };

      const ticketsCancelados = await Ticket.find(query)
        .sort({ 'datosCancelacion.fechaCancelacion': -1 })
        .skip(skip)
        .limit(limite);

      // Agrupar por transaccionId original de la cancelación
      const comprasAgrupadas = {};
      
      ticketsCancelados.forEach(ticket => {
        const transaccionIdOriginal = ticket.datosCancelacion.transaccionIdOriginal;
        
        if (!comprasAgrupadas[transaccionIdOriginal]) {
          comprasAgrupadas[transaccionIdOriginal] = {
            transaccionIdOriginal: transaccionIdOriginal,
            transaccionIdCancelacion: ticket.transaccionId,
            comprador: ticket.datosCancelacion.comprador,
            metodoPago: ticket.datosCancelacion.metodoPago,
            referenciaPago: ticket.datosCancelacion.referenciaPago,
            fechaCompra: ticket.datosCancelacion.fechaCompra,
            fechaCancelacion: ticket.datosCancelacion.fechaCancelacion,
            razon: ticket.datosCancelacion.razon,
            canceladoPor: ticket.datosCancelacion.canceladoPor,
            tickets: [],
            cantidadTickets: 0,
            numerosTickets: []
          };
        }
        
        comprasAgrupadas[transaccionIdOriginal].tickets.push({
          _id: ticket._id,
          numero: ticket.numero,
          codigo: ticket.codigo,
          precio: ticket.precio
        });
        
        comprasAgrupadas[transaccionIdOriginal].cantidadTickets++;
        comprasAgrupadas[transaccionIdOriginal].numerosTickets.push(ticket.numero);
      });

      const comprasArray = Object.values(comprasAgrupadas)
        .sort((a, b) => new Date(b.fechaCancelacion) - new Date(a.fechaCancelacion));

      const total = await Ticket.countDocuments(query);

      return {
        compras: comprasArray,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalCompras: comprasArray.length,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener compras canceladas: ${error.message}`);
    }
  }

  // En ticketRepository.js - Método cancelarCompra mejorado
  async cancelarCompra(transaccionId, razon) {
    try {
      
      // Buscar todos los tickets de esta transacción que estén VENDIDOS
      const tickets = await Ticket.find({ 
        transaccionId,
        estado: 'vendido'  // Solo tickets vendidos
      }).populate('rifa');

      if (!tickets.length) {
        throw new Error('No se encontraron tickets vendidos para esta transacción');
      }

      const rifaId = tickets[0].rifa._id;
      const rifa = tickets[0].rifa;

      if (!rifa) {
        throw new Error('Rifa no encontrada');
      }

      // Actualizar cada ticket: cambiar estado a 'disponible' y guardar datos de cancelación
      const ticketsActualizados = [];
      const nuevoTransaccionId = `CANCELADO_${Date.now()}_${transaccionId}`;
      
      for (const ticket of tickets) {
        try {
          
          // Guardar datos originales antes de limpiar
          const datosOriginales = {
            transaccionIdOriginal: ticket.transaccionId,
            comprador: { 
              nombre: ticket.comprador.nombre,
              email: ticket.comprador.email,
              telefono: ticket.comprador.telefono || '',
              estadoCiudad: ticket.comprador.estadoCiudad,
              cedula: ticket.comprador.cedula || ''
            },
            metodoPago: ticket.metodoPago,
            referenciaPago: ticket.referenciaPago || '',
            fechaCompra: ticket.fechaCompra,
            verificado: ticket.verificado,
            fechaVerificacion: ticket.fechaVerificacion || null,
            verificadoPor: ticket.verificadoPor || '',
            razon: razon,
            fechaCancelacion: new Date(),
            canceladoPor: 'Administrador'
          };

          // Actualizar el ticket usando el método save() para asegurar las validaciones
          ticket.comprador.nombre = '';
          ticket.comprador.email = '';
          ticket.comprador.telefono = '';
          ticket.comprador.estadoCiudad = '';
          ticket.comprador.cedula = '';
          ticket.estado = 'disponible';
          ticket.metodoPago = null;
          ticket.referenciaPago = null;
          ticket.fechaCompra = null;
          ticket.verificado = false;
          ticket.fechaVerificacion = null;
          ticket.verificadoPor = null;
          ticket.transaccionId = nuevoTransaccionId;
          ticket.datosCancelacion = datosOriginales;

          const ticketActualizado = await ticket.save();
          
          if (ticketActualizado) {
            ticketsActualizados.push(ticketActualizado);
          } else {
            console.error(`❌ No se pudo actualizar el ticket ${ticket.numero}`);
          }

        } catch (ticketError) {
          console.error(`❌ Error cancelando ticket ${ticket.numero}:`, ticketError);
          throw new Error(`Error cancelando ticket ${ticket.numero}: ${ticketError.message}`);
        }
      }

      if (ticketsActualizados.length !== tickets.length) {
        throw new Error(`Solo se pudieron cancelar ${ticketsActualizados.length} de ${tickets.length} tickets`);
      }

      return {
        ticketsCancelados: tickets.length,
        numerosLiberados: tickets.map(t => t.numero),
        rifa: rifaId
      };

    } catch (error) {
      console.error('❌ Error en cancelarCompra:', error);
      throw new Error(`Error al cancelar la compra: ${error.message}`);
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