const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');
const check = require('../middlewares/auth');

router.post("/save", check.auth, preferenceController.save);
router.get('/preferencesId', check.auth, preferenceController.preferencesById);
router.get('/allPreferences',check.auth, preferenceController.allPreferences);

module.exports = router;

module.exports = router;
