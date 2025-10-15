// scripts/migrarARifaUnica.js
const mongoose = require('mongoose');
const ActiveRaffle = require('../src/models/ActiveRaffle');

const migrarARifaUnica = async () => {
  try {
    console.log('🔄 Iniciando migración a rifa única...');
    
    // Contar rifas activas actuales
    const count = await ActiveRaffle.countDocuments();
    console.log(`📊 Rifas activas actuales: ${count}`);
    
    if (count > 1) {
      // Encontrar la rifa activa más reciente
      const latestActive = await ActiveRaffle.findOne().sort({ activadoEn: -1 });
      
      // Eliminar todas las demás
      await ActiveRaffle.deleteMany({ _id: { $ne: latestActive._id } });
      
      console.log('✅ Migración completada. Solo queda una rifa activa.');
    } else {
      console.log('ℹ️ Ya hay una o ninguna rifa activa. No se requiere migración.');
    }
  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => migrarARifaUnica())
    .finally(() => mongoose.connection.close());
}

module.exports = migrarARifaUnica;