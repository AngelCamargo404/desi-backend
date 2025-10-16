// repositories/winnerRepository.js
const Ticket = require('../models/Ticket');
const Winner = require('../models/Winner');
const Raffle = require('../models/Raffle');

class WinnerRepository {
    // Seleccionar ganador aleatorio
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

        // Verificar si ya existe un ganador para esta posición (si es relevante)
        // En este caso, asumimos que solo hay un ganador principal por rifa
        const ganadorExistente = await Winner.findOne({ 
            rifa: raffleId,
            esGanadorPrincipal: true 
        });

        if (ganadorExistente) {
            throw new Error('Ya existe un ganador principal para esta rifa');
        }

        // Crear registro del ganador
        const winner = new Winner({
            rifa: raffleId,
            ticket: ticketGanador._id,
            comprador: ticketGanador.comprador,
            numeroTicket: ticketGanador.numero,
            premio: 'Premio Principal', // Puedes ajustar esto según tu lógica de premios
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

    // Obtener ganadores por rifa
    async obtenerGanadoresPorRifa(raffleId) {
        try {
        const ganadores = await Winner.find({ rifa: raffleId })
            .populate('ticket')
            .populate('rifa', 'titulo descripcion')
            .populate('seleccionadoPor', 'nombre email')
            .sort({ createdAt: -1 });

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
            .sort({ fechaSorteo: -1, createdAt: -1 });

            return ganadores;
        } catch (error) {
            throw new Error(`Error al obtener ganadores: ${error.message}`);
        }
    }

    // Actualizar estado de entrega
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