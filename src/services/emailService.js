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