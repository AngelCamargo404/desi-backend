const User = require('../models/User');

class UserRepository {
  // Crear nuevo usuario
  async crearUsuario(userData) {
    try {
      // Verificar si el email ya existe
      const usuarioExistente = await User.findOne({ email: userData.email });
      if (usuarioExistente) {
        throw new Error('El email ya está registrado');
      }

      const usuario = new User(userData);
      return await usuario.save();
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  // Obtener usuario por ID
  async obtenerPorId(id) {
    try {
      const usuario = await User.findById(id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      return usuario;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  // Obtener usuario por email (con password para login)
  async obtenerPorEmailConPassword(email) {
    try {
      const usuario = await User.buscarPorEmailConPassword(email);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      return usuario;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  // Obtener usuario por email (sin password)
  async obtenerPorEmail(email) {
    try {
      const usuario = await User.findOne({ email });
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      return usuario;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  // Obtener todos los usuarios (con paginación)
  async obtenerTodos(filtros = {}, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      
      const query = {};
      
      // Aplicar filtros
      if (filtros.rol) query.rol = filtros.rol;
      if (filtros.activo !== undefined) query.activo = filtros.activo;
      if (filtros.busqueda) {
        query.$or = [
          { nombre: { $regex: filtros.busqueda, $options: 'i' } },
          { email: { $regex: filtros.busqueda, $options: 'i' } }
        ];
      }

      const usuarios = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite);

      const total = await User.countDocuments(query);

      return {
        usuarios,
        paginaActual: pagina,
        totalPaginas: Math.ceil(total / limite),
        totalUsuarios: total,
        hasNext: pagina < Math.ceil(total / limite),
        hasPrev: pagina > 1
      };
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  // Actualizar usuario
  async actualizarUsuario(id, datosActualizacion) {
    try {
      // No permitir actualizar email si ya existe
      if (datosActualizacion.email) {
        const usuarioExistente = await User.findOne({ 
          email: datosActualizacion.email, 
          _id: { $ne: id } 
        });
        if (usuarioExistente) {
          throw new Error('El email ya está en uso por otro usuario');
        }
      }

      const usuario = await User.findByIdAndUpdate(
        id,
        { ...datosActualizacion },
        { new: true, runValidators: true }
      );

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      return usuario;
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  // Eliminar usuario (soft delete)
  async eliminarUsuario(id) {
    try {
      const usuario = await User.findByIdAndUpdate(
        id,
        { activo: false },
        { new: true }
      );

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      return usuario;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  // Activar usuario
  async activarUsuario(id) {
    try {
      const usuario = await User.findByIdAndUpdate(
        id,
        { activo: true },
        { new: true }
      );

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      return usuario;
    } catch (error) {
      throw new Error(`Error al activar usuario: ${error.message}`);
    }
  }

  // Cambiar contraseña
  async cambiarPassword(id, nuevaPassword) {
    try {
      const usuario = await User.findById(id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      usuario.password = nuevaPassword;
      await usuario.save();

      return usuario;
    } catch (error) {
      throw new Error(`Error al cambiar contraseña: ${error.message}`);
    }
  }

  // Actualizar último acceso
  async actualizarUltimoAcceso(id) {
    try {
      const usuario = await User.findById(id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      return await usuario.actualizarUltimoAcceso();
    } catch (error) {
      throw new Error(`Error al actualizar último acceso: ${error.message}`);
    }
  }

  // Obtener estadísticas de usuarios
  async obtenerEstadisticas() {
    try {
      const totalUsuarios = await User.countDocuments();
      const usuariosActivos = await User.countDocuments({ activo: true });
      const admins = await User.countDocuments({ rol: 'admin' });
      const superadmins = await User.countDocuments({ rol: 'superadmin' });

      const ultimoUsuario = await User.findOne()
        .sort({ createdAt: -1 })
        .select('nombre email createdAt');

      return {
        totalUsuarios,
        usuariosActivos,
        admins,
        superadmins,
        ultimoUsuarioRegistrado: ultimoUsuario
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

module.exports = new UserRepository();