class PaymentService {
  constructor() {
    this.metodosPago = {
      transferencia: {
        nombre: 'Transferencia Bancaria',
        descripcion: 'Transferencia entre cuentas bancarias',
        requiereReferencia: true,
        requiereComprobante: true,
        instrucciones: 'Realice la transferencia a la cuenta proporcionada y envíe el comprobante',
        camposAdicionales: ['banco', 'numero_cuenta', 'titular', 'cedula']
      },
      pago_movil: {
        nombre: 'Pago Móvil',
        descripcion: 'Pago a través de Pago Móvil',
        requiereReferencia: true,
        requiereComprobante: true,
        instrucciones: 'Realice el pago móvil al número proporcionado y envíe el comprobante',
        camposAdicionales: ['banco', 'telefono', 'cedula', 'titular']
      },
      zelle: {
        nombre: 'Zelle',
        descripcion: 'Pago a través de Zelle',
        requiereReferencia: true,
        requiereComprobante: true,
        instrucciones: 'Realice el pago vía Zelle al correo proporcionado y envíe el comprobante',
        camposAdicionales: ['email', 'titular']
      },
      binance: {
        nombre: 'Binance',
        descripcion: 'Pago con criptomonedas a través de Binance',
        requiereReferencia: true,
        requiereComprobante: true,
        instrucciones: 'Realice el pago en criptomonedas a la wallet proporcionada y envíe el hash de la transacción',
        camposAdicionales: ['wallet', 'red', 'memo']
      }
    };
  }

  // Obtener información de un método de pago específico
  obtenerInformacionMetodoPago(metodoPago) {
    return this.metodosPago[metodoPago] || null;
  }

  // Obtener todos los métodos de pago con información completa
  obtenerTodosLosMetodosPago() {
    return Object.entries(this.metodosPago).map(([key, value]) => ({
      codigo: key,
      ...value
    }));
  }

  // Validar si un método de pago requiere referencia
  requiereReferencia(metodoPago) {
    const metodo = this.metodosPago[metodoPago];
    return metodo ? metodo.requiereReferencia : false;
  }

  // Validar si un método de pago requiere comprobante
  requiereComprobante(metodoPago) {
    const metodo = this.metodosPago[metodoPago];
    return metodo ? metodo.requiereComprobante : false;
  }

  // Obtener instrucciones de pago
  obtenerInstruccionesPago(metodoPago) {
    const metodo = this.metodosPago[metodoPago];
    return metodo ? metodo.instrucciones : 'Método de pago no reconocido';
  }

  // Validar método de pago
  validarMetodoPago(metodoPago) {
    return Object.keys(this.metodosPago).includes(metodoPago);
  }

  // Obtener métodos de pago disponibles (solo códigos)
  obtenerMetodosPagoDisponibles() {
    return Object.keys(this.metodosPago);
  }

  // Generar datos de pago para mostrar al usuario
  generarDatosPago(metodoPago, datosEmpresa) {
    const metodo = this.metodosPago[metodoPago];
    if (!metodo) return null;

    return {
      metodo: metodo.nombre,
      instrucciones: metodo.instrucciones,
      datos: datosEmpresa[metodoPago] || {},
      camposRequeridos: metodo.camposAdicionales
    };
  }

  // Validar datos de pago completos
  validarDatosPago(metodoPago, datosPago) {
    const metodo = this.metodosPago[metodoPago];
    if (!metodo) return false;

    // Validar campos requeridos
    for (const campo of metodo.camposAdicionales) {
      if (!datosPago[campo]) {
        return false;
      }
    }

    return true;
  }

  // Obtener resumen del método de pago
  obtenerResumenMetodoPago(metodoPago) {
    const metodo = this.metodosPago[metodoPago];
    if (!metodo) return null;

    return {
      codigo: metodoPago,
      nombre: metodo.nombre,
      descripcion: metodo.descripcion,
      requiereComprobante: metodo.requiereComprobante,
      requiereReferencia: metodo.requiereReferencia
    };
  }
}

module.exports = new PaymentService();