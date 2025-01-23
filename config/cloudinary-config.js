const cloudinary = require('cloudinary').v2;

// Configuración con tus credenciales
cloudinary.config({
    cloud_name: 'dxywuapq7', // Cambia por tu Cloud name
    api_key: '282748534946639',       // Cambia por tu API Key
    api_secret: 'V94xTVTzU22-JvXxB-NX4JSxmGE', // Cambia por tu API Secret
});

module.exports = cloudinary;
