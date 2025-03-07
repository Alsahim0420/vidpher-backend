const express = require('express');
const app = express();
const cors = require('cors');

// Configurar CORS
app.use(cors());

// Cargar rutas de Stripe antes de los middlewares JSON
const stripeRoutes = require("./routes/stripeRoutes");
app.use('/api/stripe', stripeRoutes);

// Middleware JSON para otras rutas (EXCLUYENDO webhooks)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Otras rutas
const userRoutes = require('./routes/userRoutes');
const followRoutes = require('./routes/followRoutes');
const publicationRoutes = require('./routes/publicationRoutes');
const storyRoutes = require('./routes/storyRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const savedPublicationRoutes = require('./routes/savedPublicationRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');

app.use('/api/user', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/publication', publicationRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/preference', preferenceRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/savedPublication', savedPublicationRoutes);
app.use('/api/suggestion', suggestionRoutes);

// Ruta de prueba
app.get("/ruta-prueba", (req, res) => {
    return res.status(200).json({ message: "Ruta de prueba" });
});

// Iniciar servidor
const puerto = 3900;
app.listen(puerto, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${puerto}`);
});