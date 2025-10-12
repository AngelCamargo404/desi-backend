const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('../config/cloudinary');

class FileService {
  // Subir archivo a Cloudinary
  async subirComprobanteCloudinary(filePath, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'rifa-app/comprobantes',
        resource_type: 'auto',
        ...options
      });

      // Eliminar archivo local después de subir a Cloudinary
      await fs.unlink(filePath);

      return {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      // Si hay error, intentar eliminar el archivo local
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error eliminando archivo local:', unlinkError);
      }
      throw new Error(`Error subiendo comprobante a Cloudinary: ${error.message}`);
    }
  }

  // Subir archivo localmente (fallback)
  async subirComprobanteLocal(filePath, nombreOriginal) {
    try {
      // En un entorno de producción, aquí podrías mover el archivo a un directorio persistente
      // o servirlo a través de un servidor estático
      const filename = path.basename(filePath);
      
      return {
        url: `/uploads/comprobantes/${filename}`,
        public_id: filename,
        nombreOriginal: nombreOriginal
      };
    } catch (error) {
      throw new Error(`Error procesando comprobante: ${error.message}`);
    }
  }

  // Eliminar archivo de Cloudinary
  async eliminarComprobanteCloudinary(public_id) {
    try {
      await cloudinary.uploader.destroy(public_id);
    } catch (error) {
      console.error('Error eliminando archivo de Cloudinary:', error);
    }
  }

  // Procesar comprobante (elige automáticamente entre Cloudinary y local)
  async procesarComprobante(file, usarCloudinary = true) {
    if (!file) {
      return null;
    }

    try {
      if (usarCloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
        return await this.subirComprobanteCloudinary(file.path, {
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });
      } else {
        return await this.subirComprobanteLocal(file.path, file.originalname);
      }
    } catch (error) {
      throw new Error(`Error procesando comprobante: ${error.message}`);
    }
  }

  // Validar tipo de archivo
  validarTipoArchivo(mimetype) {
    const tiposPermitidos = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
      'application/pdf'
    ];
    return tiposPermitidos.includes(mimetype);
  }
}

module.exports = new FileService();