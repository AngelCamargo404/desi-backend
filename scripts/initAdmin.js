const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const crearAdminInicial = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rifa-app');
    
    // Verificar si ya existe un admin
    const adminExistente = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminExistente) {
      console.log('✅ El administrador inicial ya existe');
      process.exit(0);
    }

    // Crear admin inicial
    const admin = new User({
      nombre: process.env.ADMIN_NOMBRE || 'Administrador Principal',
      email: process.env.ADMIN_EMAIL || 'admin@ganacondesi.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      rol: 'superadmin'
    });

    await admin.save();
    console.log('✅ Administrador inicial creado exitosamente');
    console.log(`📧 Email: ${admin.email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando administrador inicial:', error);
    process.exit(1);
  }
};

crearAdminInicial();