const nodemailer = require("nodemailer");
require("dotenv").config(); // Cargar variables de entorno

// Configurar transporter con Hostinger
const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Servidor SMTP de Hostinger
    port: 465, // Usar 465 para SSL o 587 para TLS
    secure: true, // true para 465, false para 587
    auth: {
        user: process.env.EMAIL_USER, // Tu correo en Hostinger
        pass: process.env.EMAIL_PASSWORD, // La contraseña del correo en Hostinger
    },
});

// Función para enviar correos electrónicos
const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Correo del remitente
            to, // Correo del destinatario
            subject, // Asunto del correo
            text, // Cuerpo del correo (texto plano)
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);
        console.log("Correo enviado exitosamente a", to);
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        throw error;
    }
};

// Exportar la función para usarla en otras partes de la aplicación
module.exports = sendEmail;
