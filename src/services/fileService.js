const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('../config/cloudinary');

class FileService {
  constructor() {
    this.tiposPermitidos = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/heic',
      'image/heif',
      'application/pdf'
    ];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  // Subir archivo a Cloudinary para rifas
  async subirImagenRifaCloudinary(filePath, options = {}) {
    try {
      // Verificar que el archivo existe antes de subir
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`El archivo no existe en la ruta: ${filePath}`);
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'rifa-app/rifas', // Cambiado de 'comprobantes' a 'rifas'
        resource_type: 'image', // Siempre imagen para rifas
        quality: 'auto:good', // Mejor calidad para imágenes de rifas
        fetch_format: 'auto',
        ...options
      });

      // Eliminar archivo local después de subir exitosamente
      await fs.unlink(filePath);

      return {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at
      };
    } catch (error) {
      // Limpieza en caso de error
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error eliminando archivo local:', unlinkError);
      }
      
      if (error.message.includes('File size too large')) {
        throw new Error('El archivo es demasiado grande. Máximo 10MB permitido.');
      }
      
      throw new Error(`Error subiendo imagen de rifa: ${error.message}`);
    }
  }

  // Subir imagen de rifa localmente
  async subirImagenRifaLocal(filePath, nombreOriginal) {
    try {
      // Verificar que el archivo existe
      await fs.access(filePath);
      
      // Crear directorio de uploads para rifas si no existe
      const uploadsDir = path.join(__dirname, '../../uploads/rifas');
      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      // Generar nombre único para evitar colisiones
      const timestamp = Date.now();
      const extension = path.extname(nombreOriginal);
      const baseName = path.basename(nombreOriginal, extension);
      const uniqueName = `rifa-${baseName}-${timestamp}${extension}`;
      const newPath = path.join(uploadsDir, uniqueName);

      // Mover el archivo a la ubicación permanente
      await fs.rename(filePath, newPath);

      return {
        url: `/uploads/rifas/${uniqueName}`,
        public_id: uniqueName,
        nombreOriginal: nombreOriginal,
        localPath: newPath
      };
    } catch (error) {
      // Limpieza en caso de error
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error eliminando archivo temporal:', unlinkError);
      }
      throw new Error(`Error procesando imagen de rifa local: ${error.message}`);
    }
  }

  // Procesar imagen de rifa (método específico para rifas)
  async procesarImagenRifa(file, usarCloudinary = true) {
    if (!file) {
      return null;
    }

    // Validaciones antes de procesar
    if (!this.validarTipoArchivo(file.mimetype)) {
      await this.limpiarArchivoTemporal(file.path);
      throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${this.tiposPermitidos.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      await this.limpiarArchivoTemporal(file.path);
      throw new Error('La imagen excede el tamaño máximo permitido de 10MB');
    }

    try {
      let resultado;
      
      if (usarCloudinary && this.cloudinaryConfigurado()) {
        resultado = await this.subirImagenRifaCloudinary(file.path);
      } else {
        resultado = await this.subirImagenRifaLocal(file.path, file.originalname);
      }

      return resultado;
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      await this.limpiarArchivoTemporal(file.path);
      throw error;
    }
  }

  // Eliminar imagen de rifa de Cloudinary
  async eliminarImagenRifaCloudinary(public_id) {
    try {
      if (!public_id) {
        console.warn('No se proporcionó public_id para eliminar imagen de rifa');
        return;
      }
      
      const result = await cloudinary.uploader.destroy(public_id);
      
      if (result.result !== 'ok') {
        console.warn(`No se pudo eliminar la imagen de rifa ${public_id}:`, result.result);
      }
      
      return result;
    } catch (error) {
      console.error('Error eliminando imagen de rifa de Cloudinary:', error.message);
      // No lanzamos error para no romper el flujo principal
    }
  }

  // Eliminar imagen de rifa local
  async eliminarImagenRifaLocal(public_id) {
    try {
      if (!public_id) return;
      
      const filePath = path.join(__dirname, '../../uploads/rifas', public_id);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error eliminando imagen de rifa local:', error.message);
    }
  }

  // Métodos existentes que se mantienen igual para comprobantes
  async subirComprobanteCloudinary(filePath, options = {}) {
    // ... (mantener el código existente para comprobantes)
    try {
      await fs.access(filePath);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'rifa-app/comprobantes',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        ...options
      });
      await fs.unlink(filePath);
      return {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at
      };
    } catch (error) {
      try { await fs.unlink(filePath); } catch {}
      throw new Error(`Error subiendo comprobante: ${error.message}`);
    }
  }

  async subirComprobanteLocal(filePath, nombreOriginal) {
    // ... (mantener el código existente para comprobantes)
    try {
      await fs.access(filePath);
      const uploadsDir = path.join(__dirname, '../../uploads/comprobantes');
      try { await fs.access(uploadsDir); } catch { await fs.mkdir(uploadsDir, { recursive: true }); }
      
      const timestamp = Date.now();
      const extension = path.extname(nombreOriginal);
      const baseName = path.basename(nombreOriginal, extension);
      const uniqueName = `${baseName}-${timestamp}${extension}`;
      const newPath = path.join(uploadsDir, uniqueName);

      await fs.rename(filePath, newPath);

      return {
        url: `/uploads/comprobantes/${uniqueName}`,
        public_id: uniqueName,
        nombreOriginal: nombreOriginal,
        localPath: newPath
      };
    } catch (error) {
      try { await fs.unlink(filePath); } catch {}
      throw new Error(`Error procesando comprobante local: ${error.message}`);
    }
  }

  async procesarComprobante(file, usarCloudinary = true) {
    // ... (mantener el código existente para comprobantes)
    if (!file) return null;

    if (!this.validarTipoArchivo(file.mimetype)) {
      await this.limpiarArchivoTemporal(file.path);
      throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${this.tiposPermitidos.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      await this.limpiarArchivoTemporal(file.path);
      throw new Error('El archivo excede el tamaño máximo permitido de 10MB');
    }

    try {
      let resultado;
      if (usarCloudinary && this.cloudinaryConfigurado()) {
        resultado = await this.subirComprobanteCloudinary(file.path);
      } else {
        resultado = await this.subirComprobanteLocal(file.path, file.originalname);
      }
      return resultado;
    } catch (error) {
      await this.limpiarArchivoTemporal(file.path);
      throw error;
    }
  }

  async eliminarComprobanteCloudinary(public_id) {
    // ... (mantener el código existente)
    try {
      if (!public_id) return;
      const result = await cloudinary.uploader.destroy(public_id);
      if (result.result !== 'ok') {
        console.warn(`No se pudo eliminar el comprobante ${public_id}:`, result.result);
      }
      return result;
    } catch (error) {
      console.error('Error eliminando comprobante de Cloudinary:', error.message);
    }
  }

  async eliminarComprobanteLocal(public_id) {
    // ... (mantener el código existente)
    try {
      if (!public_id) return;
      const filePath = path.join(__dirname, '../../uploads/comprobantes', public_id);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error eliminando comprobante local:', error.message);
    }
  }

  // Métodos de utilidad (se mantienen igual)
  validarTipoArchivo(mimetype) {
    return this.tiposPermitidos.includes(mimetype);
  }

  async limpiarArchivoTemporal(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error limpiando archivo temporal:', error.message);
    }
  }

  obtenerTiposPermitidos() {
    return {
      tipos: this.tiposPermitidos,
      maxFileSize: this.maxFileSize,
      extensiones: ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.pdf']
    };
  }

  cloudinaryConfigurado() {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && 
              process.env.CLOUDINARY_API_KEY && 
              process.env.CLOUDINARY_API_SECRET);
  }
}

module.exports = new FileService();