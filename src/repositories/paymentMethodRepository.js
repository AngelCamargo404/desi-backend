// repositories/paymentMethodRepository.js
const PaymentMethod = require("../models/paymentMethod");

class PaymentMethodRepository {
  async obtenerTodos() {
    try {
      return await PaymentMethod.find().sort({ orden: 1, codigo: 1 });
    } catch (error) {
      throw new Error(`Error al obtener métodos de pago: ${error.message}`);
    }
  }

  async obtenerActivos() {
    try {
      return await PaymentMethod.find({ activo: true }).sort({ orden: 1, codigo: 1 });
    } catch (error) {
      throw new Error(`Error al obtener métodos de pago activos: ${error.message}`);
    }
  }

  async obtenerPorCodigo(codigo) {
    try {
      return await PaymentMethod.findOne({ codigo });
    } catch (error) {
      throw new Error(`Error al obtener método de pago: ${error.message}`);
    }
  }

  async crear(datos) {
    try {
      const paymentMethod = new PaymentMethod(datos);
      return await paymentMethod.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Ya existe un método de pago con ese código');
      }
      throw new Error(`Error al crear método de pago: ${error.message}`);
    }
  }

  async actualizar(codigo, datos) {
    try {
      const paymentMethod = await PaymentMethod.findOneAndUpdate(
        { codigo },
        { $set: datos },
        { new: true, runValidators: true }
      );
      

      if (!paymentMethod) {
        throw new Error('Método de pago no encontrado');
      }

      return paymentMethod;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Ya existe un método de pago con ese código');
      }
      throw new Error(`Error al actualizar método de pago: ${error.message}`);
    }
  }

  async eliminar(codigo) {
    try {
      const paymentMethod = await PaymentMethod.findOneAndDelete({ codigo });
      
      if (!paymentMethod) {
        throw new Error('Método de pago no encontrado');
      }

      return paymentMethod;
    } catch (error) {
      throw new Error(`Error al eliminar método de pago: ${error.message}`);
    }
  }

  async cambiarEstado(codigo, activo) {
    try {
      const paymentMethod = await PaymentMethod.findOneAndUpdate(
        { codigo },
        { $set: { activo } },
        { new: true }
      );

      if (!paymentMethod) {
        throw new Error('Método de pago no encontrado');
      }

      return paymentMethod;
    } catch (error) {
      throw new Error(`Error al cambiar estado: ${error.message}`);
    }
  }
}

module.exports = new PaymentMethodRepository();