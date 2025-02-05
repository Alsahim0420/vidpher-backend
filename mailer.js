const nodemailer = require("nodemailer");

// Configura el transporter (puedes usar Gmail, Outlook, o cualquier otro servicio de correo)
const transporter = nodemailer.createTransport({
    service: "gmail", // Puedes usar "outlook", "yahoo", etc.
    auth: {
        user: process.env.EMAIL_USER, // Tu correo electrónico
        pass: process.env.EMAIL_PASSWORD, // Tu contraseña de aplicación (no la contraseña normal)
    },
});

// Función para enviar el correo electrónico
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
        console.log("Correo enviado exitosamente");
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        throw error;
    }
};

module.exports = sendEmail;