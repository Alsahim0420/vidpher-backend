const express = require('express');
const router = express.Router();
const savedPublicationController = require('../controllers/savedPublicationController');
const check = require("../middlewares/auth");



router.post("/save-publication", check.auth, savedPublicationController.toggleSavePublication);