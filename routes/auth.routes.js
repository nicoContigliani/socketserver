const express = require('express');
const router = express.Router();
const authController = require('../Apiservices/controller');
const verifyToken = require('../middlewares/auth');

// Ruta de login
router.post('/login', authController.login);

// Ruta de registro
router.post('/register', authController.register);

// Ruta protegida de ejemplo
router.get('/profile', verifyToken, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;