// middlewares/uploadRaffle.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. Directorio Específico para Imágenes de Rifas ---
const raffleUploadsDir = path.join(__dirname, '../uploads/raffles'); // Directorio para imágenes de rifas

if (!fs.existsSync(raffleUploadsDir)) {
  fs.mkdirSync(raffleUploadsDir, { recursive: true });
}

// --- 2. Configuración de Almacenamiento para Rifas ---
const raffleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, raffleUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'rifa-' + uniqueSuffix + extension); // Nombre con prefijo 'rifa-'
  }
});

// --- 3. Filtrar Tipos de Archivo (Puedes simplificarlo o usar el mismo fileFilter) ---
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|heic|heif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, HEIC)'));
  }
};

// --- 4. Configurar Multer para la Rifa ---
const uploadRaffle = multer({
  storage: raffleStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Quizás un límite más bajo para imágenes de rifas (ej. 5MB)
  },
  fileFilter: imageFileFilter
});

// --- 5. Exportar el Middleware específico ---
module.exports = uploadRaffle.single('imagen'); // ✅ Exporta el middleware configurado para el campo 'imagen'