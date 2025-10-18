// services/paymentService.js - SIMPLIFICADO
const paymentMethodRepository = require('../repositories/paymentMethodRepository');

class PaymentService {
  constructor() {
    this.metodosPagoCache = [];
    this.ultimaActualizacion = null;
    this.CACHE_DURACION = 5 * 60 * 1000; // 5 minutos
  }

  // Actualizar cache de métodos de pago
  async actualizarCache() {
    try {
      this.metodosPagoCache = await paymentMethodRepository.obtenerActivos();
      this.ultimaActualizacion = new Date();
    } catch (error) {
      console.error('❌ Error actualizando cache de métodos de pago:', error);
      if (!this.metodosPagoCache) {
        this.metodosPagoCache = [];
      }
    }
  }

  // Obtener métodos de pago (con cache y manejo de errores)
  async obtenerMetodosPago() {
    try {
      if (!this.metodosPagoCache || 
          !this.ultimaActualizacion || 
          (new Date() - this.ultimaActualizacion) > this.CACHE_DURACION) {
        await this.actualizarCache();
      }
      return this.metodosPagoCache || [];
    } catch (error) {
      console.error('❌ Error obteniendo métodos de pago:', error);
      return [];
    }
  }

  // Obtener información de un método de pago específico
  async obtenerInformacionMetodoPago(codigo) {
    try {
      const metodos = await this.obtenerMetodosPago();
      const metodo = metodos.find(m => m.codigo === codigo);
      
      if (!metodo) {
        console.warn(`⚠️ Método de pago no encontrado: ${codigo}`);
        return null;
      }

      // Usar el método obtenerDatosPublicos que filtra campos vacíos
      const datosPublicos = metodo.obtenerDatosPublicos();

      return {
        codigo: metodo.codigo,
        nombre: metodo.nombre,
        requiereReferencia: metodo.requiereReferencia,
        requiereComprobante: metodo.requiereComprobante,
        datos: datosPublicos.datos,
        camposAdicionales: Object.keys(datosPublicos.datos)
      };
    } catch (error) {
      console.error(`❌ Error obteniendo información de método ${codigo}:`, error);
      return null;
    }
  }

  // Obtener todos los métodos de pago con información completa
  async obtenerTodosLosMetodosPago() {
    try {
      const metodos = await this.obtenerMetodosPago();
      
      return metodos.map(metodo => {
        const datosPublicos = metodo.obtenerDatosPublicos();
        return {
          codigo: metodo.codigo,
          nombre: metodo.nombre,
          requiereReferencia: metodo.requiereReferencia,
          requiereComprobante: metodo.requiereComprobante,
          datos: datosPublicos.datos,
          camposAdicionales: Object.keys(datosPublicos.datos),
          activo: metodo.activo,
          orden: metodo.orden
        };
      });
    } catch (error) {
      console.error('❌ Error obteniendo todos los métodos de pago:', error);
      return [];
    }
  }

  // Validar si un método de pago requiere referencia
  async requiereReferencia(metodoPago) {
    try {
      const metodo = await this.obtenerInformacionMetodoPago(metodoPago);
      return metodo ? metodo.requiereReferencia : false;
    } catch (error) {
      console.error(`❌ Error validando referencia para ${metodoPago}:`, error);
      return true;
    }
  }

  // Validar si un método de pago requiere comprobante
  async requiereComprobante(metodoPago) {
    try {
      const metodo = await this.obtenerInformacionMetodoPago(metodoPago);
      return metodo ? metodo.requiereComprobante : false;
    } catch (error) {
      console.error(`❌ Error validando comprobante para ${metodoPago}:`, error);
      return true;
    }
  }

  // Validar método de pago
  async validarMetodoPago(metodoPago) {
    try {
      const metodo = await this.obtenerInformacionMetodoPago(metodoPago);
      return !!metodo;
    } catch (error) {
      console.error(`❌ Error validando método de pago ${metodoPago}:`, error);
      return false;
    }
  }

  // Obtener métodos de pago disponibles (solo códigos)
  async obtenerMetodosPagoDisponibles() {
    try {
      const metodos = await this.obtenerMetodosPago();
      return metodos.map(m => m.codigo);
    } catch (error) {
      console.error('❌ Error obteniendo métodos disponibles:', error);
      return [];
    }
  }

  // Generar datos de pago para mostrar al usuario
  async generarDatosPago(metodoPago) {
    try {
      const metodo = await this.obtenerInformacionMetodoPago(metodoPago);
      if (!metodo) {
        return {
          metodo: 'Método de Pago',
          datos: {},
          camposRequeridos: []
        };
      }

      return {
        metodo: metodo.nombre,
        datos: metodo.datos,
        camposRequeridos: metodo.camposAdicionales
      };
    } catch (error) {
      console.error(`❌ Error generando datos de pago para ${metodoPago}:`, error);
      return {
        metodo: 'Método de Pago',
        datos: {},
        camposRequeridos: []
      };
    }
  }

  // Validar datos de pago completos
  async validarDatosPago(metodoPago, datosPago) {
    try {
      const metodo = await this.obtenerInformacionMetodoPago(metodoPago);
      if (!metodo) return false;

      // Validar campos requeridos (solo los que tienen valor)
      for (const campo of metodo.camposAdicionales) {
        if (!datosPago[campo]) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`❌ Error validando datos de pago para ${metodoPago}:`, error);
      return false;
    }
  }

  // Obtener resumen del método de pago
  async obtenerResumenMetodoPago(metodoPago) {
    try {
      const metodo = await this.obtenerInformacionMetodoPago(metodoPago);
      if (!metodo) return null;

      return {
        codigo: metodoPago,
        nombre: metodo.nombre,
        requiereComprobante: metodo.requiereComprobante,
        requiereReferencia: metodo.requiereReferencia
      };
    } catch (error) {
      console.error(`❌ Error obteniendo resumen para ${metodoPago}:`, error);
      return null;
    }
  }

  // Forzar actualización del cache
  async forzarActualizacionCache() {
    await this.actualizarCache();
  }

  // Inicializar el servicio
  async inicializar() {
    await this.actualizarCache();
    console.log('✅ Servicio de pagos inicializado');
  }
}

module.exports = new PaymentService();