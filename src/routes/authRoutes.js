// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authMiddleware, superAdminAuth } = require('../middleware/authMiddleware'); // Importar los middlewares

// Rutas públicas de autenticación
router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Rutas protegidas de autenticación
router.get('/perfil', authMiddleware, authController.obtenerPerfil);
router.put('/cambiar-password', authMiddleware, authController.cambiarPassword);
router.get('/verificar', authMiddleware, authController.verificarToken);

// Rutas de gestión de usuarios (solo superadmin)
router.get('/usuarios', authMiddleware, superAdminAuth, userController.obtenerUsuarios);
router.get('/usuarios/estadisticas', authMiddleware, superAdminAuth, userController.obtenerEstadisticas);
router.get('/usuarios/:id', authMiddleware, superAdminAuth, userController.obtenerUsuario);
router.put('/usuarios/:id', authMiddleware, superAdminAuth, userController.actualizarUsuario);
router.delete('/usuarios/:id', authMiddleware, superAdminAuth, userController.eliminarUsuario);
router.patch('/usuarios/:id/activar', authMiddleware, superAdminAuth, userController.activarUsuario);

// Nueva ruta para crear usuario (solo superadmin)
router.post('/admin/crear-usuario', authMiddleware, superAdminAuth, userController.crearUsuario);

module.exports = router;