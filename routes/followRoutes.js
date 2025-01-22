const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const check = require('../middlewares/auth');

//Definir las rutas de la API
router.get("/prueba_follow", followController.prueba_follow);
router.post("/save", check.auth, followController.save);
router.delete("/unfollow/:id", check.auth, followController.unfollow);   
router.get("/following/:id?/:page?", check.auth,followController.following);
router.get("/followers/:id?/:page?", check.auth,followController.followers);


//Exportar el modulo de rutas
module.exports = router;