const admin = require("firebase-admin");
const path = require("path");

// Ruta al archivo de credenciales JSON
const serviceAccount = require(path.join(__dirname, "../../config/firebaseServiceAccountKey.json"));

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
