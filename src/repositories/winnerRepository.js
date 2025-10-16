// repositories/winnerRepository.js
const Ticket = require('../models/Ticket');
const Winner = require('../models/Winner');
const Raffle = require('../models/Raffle');
const Prize = require('../models/Prize');

class WinnerRepository {
  // Seleccionar múltiples ganadores según la cantidad de premios
  async seleccionarMultiplesGanadores(raffleId, usuarioId, premios) {
    try {
      // Verificar que la rifa existe
      const rifa = await Raffle.findById(raffleId);
      if (!rifa) {
        throw new Error('Rifa no encontrada');
      }

      // Obtener todos los tickets vendidos para esta rifa
      const ticketsVendidos = await Ticket.find({
        rifa: raffleId,
        estado: 'vendido',
        verificado: true
      });

      if (ticketsVendidos.length === 0) {
        throw new Error('No hay tickets vendidos y verificados para esta rifa');
      }

      // Verificar que hay suficientes tickets para los premios
      if (ticketsVendidos.length < premios.length) {
        throw new Error(`No hay suficientes tickets vendidos (${ticketsVendidos.length}) para asignar ${premios.length} premios`);
      }

      // Verificar si ya existen ganadores para esta rifa
      const ganadoresExistentes = await Winner.find({ rifa: raffleId });
      if (ganadoresExistentes.length > 0) {
        throw new Error('Ya existen ganadores para esta rifa. Debe eliminar los ganadores existentes antes de realizar un nuevo sorteo.');
      }

      // Mezclar los tickets aleatoriamente
      const ticketsMezclados = [...ticketsVendidos].sort(() => Math.random() - 0.5);

      // Seleccionar los primeros N tickets (donde N = cantidad de premios)
      const ticketsGanadores = ticketsMezclados.slice(0, premios.length);

      // Crear registros de winners para cada premio
      const winners = [];
      for (let i = 0; i < premios.length; i++) {
        const premio = premios[i];
        const ticketGanador = ticketsGanadores[i];

        const winner = new Winner({
          rifa: raffleId,
          ticket: ticketGanador._id,
          comprador: ticketGanador.comprador,
          numeroTicket: ticketGanador.numero,
          premio: premio.nombre,
          descripcionPremio: premio.descripcion,
          valorPremio: premio.valor,
          posicionPremio: premio.posicion || (i + 1),
          esGanadorPrincipal: (i === 0), // El primer premio es el principal
          seleccionadoPor: usuarioId
        });

        await winner.save();

        // Actualizar el estado del ticket a "ganador"
        ticketGanador.estado = 'ganador';
        await ticketGanador.save();

        // Poblar la información del winner
        await winner.populate('ticket');
        await winner.populate('rifa', 'titulo descripcion');

        winners.push(winner);
      }

      return winners;
    } catch (error) {
      throw new Error(`Error al seleccionar múltiples ganadores: ${error.message}`);
    }
  }

  // Método original para un solo ganador (mantener por compatibilidad)
  async seleccionarGanadorAleatorio(raffleId, usuarioId) {
    try {
      // Verificar que la rifa existe
      const rifa = await Raffle.findById(raffleId);
      if (!rifa) {
        throw new Error('Rifa no encontrada');
      }

      // Obtener todos los tickets vendidos para esta rifa
      const ticketsVendidos = await Ticket.find({
        rifa: raffleId,
        estado: 'vendido',
        verificado: true
      });

      if (ticketsVendidos.length === 0) {
        throw new Error('No hay tickets vendidos y verificados para esta rifa');
      }

      // Seleccionar un ticket aleatorio
      const indiceAleatorio = Math.floor(Math.random() * ticketsVendidos.length);
      const ticketGanador = ticketsVendidos[indiceAleatorio];

      // Verificar si ya existe un ganador principal
      const ganadorExistente = await Winner.findOne({ 
        rifa: raffleId,
        esGanadorPrincipal: true 
      });

      if (ganadorExistente) {
        throw new Error('Ya existe un ganador principal para esta rifa');
      }

      // Obtener el premio principal (posición 1)
      const premioPrincipal = await Prize.findOne({ 
        rifa: raffleId, 
        posicion: 1 
      });

      // Crear registro del ganador
      const winner = new Winner({
        rifa: raffleId,
        ticket: ticketGanador._id,
        comprador: ticketGanador.comprador,
        numeroTicket: ticketGanador.numero,
        premio: premioPrincipal ? premioPrincipal.nombre : 'Premio Principal',
        descripcionPremio: premioPrincipal ? premioPrincipal.descripcion : '',
        valorPremio: premioPrincipal ? premioPrincipal.valor : null,
        posicionPremio: 1,
        esGanadorPrincipal: true,
        seleccionadoPor: usuarioId
      });

      await winner.save();

      // Actualizar el estado del ticket a "ganador"
      ticketGanador.estado = 'ganador';
      await ticketGanador.save();

      // Poblar la información completa para retornar
      await winner.populate('ticket');
      await winner.populate('rifa', 'titulo descripcion');

      return winner;
    } catch (error) {
      throw new Error(`Error al seleccionar ganador: ${error.message}`);
    }
  }

  // Los demás métodos se mantienen igual...
  async obtenerGanadoresPorRifa(raffleId) {
    try {
      const ganadores = await Winner.find({ rifa: raffleId })
        .populate('ticket')
        .populate('rifa', 'titulo descripcion')
        .populate('seleccionadoPor', 'nombre email')
        .sort({ posicionPremio: 1, createdAt: -1 });

      return ganadores;
    } catch (error) {
      throw new Error(`Error al obtener ganadores: ${error.message}`);
    }
  }

  async obtenerTodosLosGanadores() {
    try {
      const ganadores = await Winner.find()
        .populate('rifa', 'titulo descripcion')
        .populate('ticket')
        .populate('seleccionadoPor', 'nombre email')
        .sort({ fechaSorteo: -1, posicionPremio: 1 });

      return ganadores;
    } catch (error) {
      throw new Error(`Error al obtener ganadores: ${error.message}`);
    }
  }

  async actualizarEstadoEntrega(winnerId, entregado, fechaEntrega = null, notasEntrega = '') {
    try {
      const winner = await Winner.findByIdAndUpdate(
        winnerId,
        {
          entregado,
          fechaEntrega: entregado ? (fechaEntrega || new Date()) : null,
          notasEntrega: entregado ? notasEntrega : ''
        },
        { new: true, runValidators: true }
      ).populate('rifa', 'titulo descripcion')
      .populate('ticket')
      .populate('seleccionadoPor', 'nombre email');

      if (!winner) {
        throw new Error('Ganador no encontrado');
      }

      return winner;
    } catch (error) {
      throw new Error(`Error al actualizar estado de entrega: ${error.message}`);
    }
  }
}

module.exports = new WinnerRepository();