const userRepository = require('../repositories/userRepository');

class UserController {
  // Obtener todos los usuarios (para superadmin)
  async obtenerUsuarios(req, res) {
    try {
      const { pagina, limite, rol, activo, busqueda } = req.query;
      
      const resultado = await userRepository.obtenerTodos(
        { rol, activo, busqueda },
        parseInt(pagina) || 1,
        parseInt(limite) || 10
      );

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener usuario por ID
  async obtenerUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuario = await userRepository.obtenerPorId(id);

      res.json({
        success: true,
        data: usuario.infoPublica
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar usuario
  async actualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      // No permitir cambiar ciertos campos sensibles
      delete datosActualizacion.password;
      delete datosActualizacion.email; // El email se cambia con verificación

      const usuario = await userRepository.actualizarUsuario(id, datosActualizacion);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuario.infoPublica
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Eliminar usuario (soft delete)
  async eliminarUsuario(req, res) {
    try {
      const { id } = req.params;
      await userRepository.eliminarUsuario(id);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Activar usuario
  async activarUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuario = await userRepository.activarUsuario(id);

      res.json({
        success: true,
        message: 'Usuario activado exitosamente',
        data: usuario.infoPublica
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await userRepository.obtenerEstadisticas();

      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async crearUsuario(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;

      // Validar campos obligatorios
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y password son requeridos'
        });
      }

      // Validar formato de email
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Por favor ingresa un email válido'
        });
      }

      // Validar longitud de password
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Crear el usuario
      const usuario = await userRepository.crearUsuario({
        nombre,
        email,
        password,
        rol: rol || 'admin'
      });

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: usuario.infoPublica
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new UserController();