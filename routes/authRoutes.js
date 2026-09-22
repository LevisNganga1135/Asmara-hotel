// routes/authRoutes.js
// Routing for staff authentication and MFA flows

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminAuth = require('../middleware/adminAuth');

// 1. Password login check (Stage 1)
router.post('/login', authController.login);

// 2. MFA code verification (Stage 2)
router.post('/mfa/verify', authController.verifyMfa);

// 3. Staff registration — protected by REGISTRATION_SECRET header.
//    Only callers who supply the correct X-Registration-Secret header
//    (matching the REGISTRATION_SECRET env var) may create staff accounts.
router.post('/register', adminAuth, authController.register);

module.exports = router;
