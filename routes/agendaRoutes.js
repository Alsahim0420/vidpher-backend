const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
const check = require('../middlewares/auth');

router.post("/save", check.auth, agendaController.save);
router.get("/byDate/:date", check.auth, agendaController.save);


module.exports = router;