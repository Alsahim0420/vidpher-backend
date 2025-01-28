const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');
const check = require('../middlewares/auth');

router.post("/save", check.auth, preferenceController.save);
router.get('/preferencesId', check.auth, PreferencesById);
router.get('/allPreferences', getAllPreferences);

module.exports = router;
