const cloudinary = require('cloudinary').v2;

const configCloudinary = () => {
  // Verificar si las variables de entorno están configuradas
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️  Cloudinary no está configurado. Variables de entorno faltantes.');
    console.warn('   Los archivos se guardarán localmente.');
    return null;
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    console.log('✅ Cloudinary configurado correctamente');
    return cloudinary;
  } catch (error) {
    console.error('❌ Error configurando Cloudinary:', error.message);
    return null;
  }
};

// Configurar inmediatamente al cargar el módulo
const cloudinaryInstance = configCloudinary();

module.exports = cloudinaryInstance;