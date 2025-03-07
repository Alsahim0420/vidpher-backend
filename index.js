// Importar dependencias
const connection = require('./database/connection');
const express = require('express');
const cors = require('cors');
const cronJobs = require('./cronJobs');
require("dotenv").config();

// Mensaje de Bienvenida
console.log("Bienvenido a Vidpher API");

// Conexión a la base de datos
connection();

// Crear servidor de node
const app = express();
const puerto = 3900;

// Configurar CORS
app.use(cors());

// ⚠️ Middleware para convertir el body a JSON (pero EXCLUYENDO el webhook de Stripe)
app.use(express.json({ type: "application/json" }));
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const followRoutes = require('./routes/followRoutes');
const publicationRoutes = require('./routes/publicationRoutes');
const storyRoutes = require('./routes/storyRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const savedPublicationRoutes = require('./routes/savedPublicationRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const stripeRoutes = require('./routes/stripeRoutes');

// Cargar rutas normales
app.use('/api/user', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/publication', publicationRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/preference', preferenceRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/savedPublication', savedPublicationRoutes);
app.use('/api/suggestion', suggestionRoutes);

// ⚠️ EXCLUIMOS el webhook de Stripe de `express.json()`
app.use('/api/stripe', stripeRoutes); // El `raw()` ya está en `stripeRoutes.js`

// Ruta de prueba
app.get("/ruta-prueba", (req, res) => {
    return res.status(200).json({ message: "Ruta de prueba" });
});

// Iniciar servidor
app.listen(puerto, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${puerto}`);
    console.log('⏳ Iniciando tareas programadas...');
    cronJobs;
});
