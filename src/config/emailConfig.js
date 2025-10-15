const nodemailer = require('nodemailer');

const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};
console.log(emailConfig);

const transporter = nodemailer.createTransport(emailConfig);

// Verificar la conexión
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error configurando el servicio de email:', error);
  } else {
    console.log('✅ Servicio de email configurado correctamente');
  }
});

module.exports = transporter;