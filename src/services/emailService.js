const transporter = require('../config/emailConfig');
const path = require('path');
const ejs = require('ejs');

class EmailService {
  constructor() {
    this.from = process.env.EMAIL_FROM || 'rifas@tudominio.com';
  }

  // Método para enviar email de ticket aprobado
  async enviarTicketAprobado(ticket, rifa) {
    try {
      console.log('📧 Preparando email de ticket aprobado para:', ticket.comprador.email);
      
      const templatePath = path.join(__dirname, '../templates/email/ticketAprobado.ejs');
      
      // Renderizar el template HTML
      const html = await ejs.renderFile(templatePath, {
        ticket: ticket,
        rifa: rifa,
        appUrl: process.env.APP_URL || 'http://localhost:3000',
        fecha: new Date().toLocaleDateString('es-ES')
      });

      const mailOptions = {
        from: this.from,
        to: ticket.comprador.email,
        subject: `🎉 ¡Ticket Aprobado! - ${rifa.titulo}`,
        html: html,
        text: this.generarTextoPlano(ticket, rifa) // Versión en texto plano
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email enviado correctamente:', result.messageId);
      return result;
      
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw new Error(`Error al enviar el email: ${error.message}`);
    }
  }

  // Enviar un solo email que incluya todos los tickets de una compra/transacción
  async enviarCompraAprobada(transaccionId, tickets, rifa) {
    try {
      if (!tickets || tickets.length === 0) {
        throw new Error('No hay tickets para enviar en esta transacción');
      }

      const destinatario = tickets[0].comprador?.email;
      if (!destinatario) {
        throw new Error('No se encontró email del comprador en los tickets');
      }

      console.log('📧 Preparando email de compra aprobada para:', destinatario, 'transaccion:', transaccionId);

      // Crear HTML simple que liste los tickets
      const itemsHtml = tickets.map(t => `
        <tr style="border-bottom:1px solid #eaeaea;">
          <td style="padding:8px">#${t.numero}</td>
          <td style="padding:8px">${t.codigo}</td>
          <td style="padding:8px">$${t.precio || rifa.precioTicket}</td>
        </tr>
      `).join('\n');

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#333">
          <h2>¡Compra Aprobada! - ${rifa.titulo}</h2>
          <p>Tu compra con ID <strong>${transaccionId}</strong> ha sido verificada y los siguientes tickets han sido aprobados:</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <thead>
              <tr style="background:#f6f6f6">
                <th style="text-align:left;padding:8px">Número</th>
                <th style="text-align:left;padding:8px">Código</th>
                <th style="text-align:left;padding:8px">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="margin-top:16px">Gracias por participar. Te deseamos mucha suerte.</p>
          <p>Saludos,<br/>El equipo de Rifas</p>
        </div>
      `;

      const mailOptions = {
        from: this.from,
        to: destinatario,
        subject: `🎉 Compra Aprobada - ${rifa.titulo}`,
        html,
        text: this.generarTextoPlanoMultiple(transaccionId, tickets, rifa)
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email de compra enviado correctamente:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Error enviando email de compra aprobada:', error);
      throw new Error(`Error al enviar el email de compra aprobada: ${error.message}`);
    }
  }

  generarTextoPlanoMultiple(transaccionId, tickets, rifa) {
    const header = `FELICITACIONES! Tu compra ${transaccionId} ha sido aprobada.\n\nRifa: ${rifa.titulo}\n`;
    const lines = tickets.map(t => `- Número: #${t.numero} | Código: ${t.codigo} | Precio: $${t.precio || rifa.precioTicket}`).join('\n');
    return `${header}\nTICKETS:\n${lines}\n\nMucha suerte!`;
  }

  // Generar versión en texto plano del email
  generarTextoPlano(ticket, rifa) {
    return `
¡FELICITACIONES! 🎉

Tu ticket ha sido aprobado exitosamente y ya estás participando en la rifa.

INFORMACIÓN DEL TICKET:
------------------------
Rifa: ${rifa.titulo}
Número de Ticket: #${ticket.numero}
Código Único: ${ticket.codigo}
Comprador: ${ticket.comprador.nombre}
Email: ${ticket.comprador.email}
Fecha de Aprobación: ${new Date().toLocaleDateString('es-ES')}

¡Mucha suerte en el sorteo!

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
El equipo de Rifas
    `.trim();
  }

  // Método para verificar la configuración del email
  async verificarConexion() {
    try {
      await transporter.verify();
      return { success: true, message: 'Conexión con el servidor de email establecida' };
    } catch (error) {
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
  }
}

module.exports = new EmailService();