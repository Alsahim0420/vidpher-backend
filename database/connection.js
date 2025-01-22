const mongoose = require('mongoose');

// Cadena de conexión
const uri = 'mongodb+srv://GabrielRamirez:Real2madrid@vipdher.1fus1.mongodb.net/?retryWrites=true&w=majority&appName=vipdher';

// Función para conectar a MongoDB
const connection = async () => {
   try {
      await mongoose.connect(uri); // No es necesario especificar las opciones obsoletas
      console.log('Conexión exitosa a MongoDB Atlas');
   } catch (err) {
      console.error('Error al conectar a MongoDB Atlas:', err);
      throw err; // Lanza el error si ocurre, para que puedas manejarlo en `index.js`
   }
};

module.exports = connection;

