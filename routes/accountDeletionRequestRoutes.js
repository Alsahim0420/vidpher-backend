const express = require('express');
const router = express.Router();
const accountDeletionRequestController = require('../controllers/accountDeletionRequestController');
const check = require('../middlewares/auth');

// Definir las rutas de la API
router.post("/request", accountDeletionRequestController.requestAccountDeletion);
router.get("/all", check.auth, accountDeletionRequestController.getAllDeletionRequests);
router.get("/:id", check.auth, accountDeletionRequestController.getDeletionRequestById);

// Exportar el módulo de rutas
module.exports = router; 