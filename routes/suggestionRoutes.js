const express = require("express");
const router = express.Router();
const suggestionController = require("../controllers/suggestionController");
const check = require("../middlewares/auth");// Middleware de autenticación

// Ruta para obtener las sugerencias de publicaciones
router.get("/suggestions", check.auth, suggestionController.getSuggestions);

module.exports = router;