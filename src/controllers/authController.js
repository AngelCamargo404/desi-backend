const userRepository = require('../repositories/userRepository');
const User = require('../models/User');

class AuthController {
  async login(req, res) {
    try {
      console.log('🔐 Login attempt received');
      const { email, password } = req.body;

      // Validar campos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      console.log('📧 Searching user:', email);
      
      // Obtener usuario
      const usuario = await userRepository.obtenerPorEmailConPassword(email);
      console.log('✅ User found:', usuario.email);

      // Verificar activo
      if (!usuario.activo) {
        return res.status(401).json({
          success: false,
          message: 'Cuenta desactivada'
        });
      }

      // Verificar password
      console.log('🔑 Verifying password...');
      const passwordValido = await usuario.compararPassword(password);
      if (!passwordValido) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      console.log('✅ Password correct');

      // Actualizar último acceso
      await userRepository.actualizarUltimoAcceso(usuario._id);

      // Generar token
      const token = usuario.generarToken();
      console.log('✅ Token generated');

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          usuario: usuario.infoPublica
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error.message);
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async registrar(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;
      const usuario = await userRepository.crearUsuario({
        nombre,
        email,
        password,
        rol: rol || 'admin'
      });

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: { usuario: usuario.infoPublica }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener perfil del usuario logueado
  async obtenerPerfil(req, res) {
    try {
      // En un sistema real, esto vendría del token/middleware
      const usuarioId = req.user?.id; // Asumiendo que tienes middleware de auth
      const usuario = await userRepository.obtenerPorId(usuarioId);

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

  // Cambiar contraseña
  async cambiarPassword(req, res) {
    try {
      const usuarioId = req.user?.id;
      const { passwordActual, nuevaPassword } = req.body;

      if (!passwordActual || !nuevaPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva contraseña son requeridas'
        });
      }

      if (nuevaPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Verificar contraseña actual
      const usuario = await userRepository.obtenerPorEmailConPassword(req.user.email);
      const esPasswordValido = await usuario.compararPassword(passwordActual);
      
      if (!esPasswordValido) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Cambiar contraseña
      await userRepository.cambiarPassword(usuarioId, nuevaPassword);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Cerrar sesión (client-side, pero podemos registrar)
  async logout(req, res) {
    try {
      // En un sistema JWT, esto sería manejado en el cliente
      // Pero podemos registrar el logout si es necesario
      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Verificar token (para mantener sesión)
  async verificarToken(req, res) {
    try {
      const usuarioId = req.user?.id;
      const usuario = await userRepository.obtenerPorId(usuarioId);

      res.json({
        success: true,
        data: usuario.infoPublica
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  }
}

module.exports = new AuthController();