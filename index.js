//Importar dependencias
const connection = require('./database/connection');
const express = require('express');
const cors = require('cors');
const cronJobs = require('./cronJobs');
require("dotenv").config();


//Mensaje de Bienvenioda
console.log("Bienvenido a Vidpher API");

//Conexion a la base e datos 
connection();

//Crear servidor de node
const app = express();
const puerto = 3900;

//Configurar CORS
app.use(cors());

//COnvertir los datos del body a objetos js
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Cargar conf rutas
const userRoutes = require('./routes/userRoutes');
const followRoutes = require('./routes/followRoutes');
const publicationRoutes = require('./routes/publicationRoutes');
const storyRoutes = require('./routes/storyRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');


app.use('/api/user', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/publication', publicationRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/preference', preferenceRoutes);
app.use('/api/payment', paymentRoutes);

//ruta de prueba
app.get("/ruta-prueba", (req, res) => {
    return res.status(200).json({message: "Ruta de prueba"});
});

// Poner servidor a escuchar peticiones http 
app.listen(puerto, () => {
    console.log(`Servidor corriendo en http://localhost:${puerto}`);
    console.log('Iniciando tareas programadas...');
    cronJobs;
})