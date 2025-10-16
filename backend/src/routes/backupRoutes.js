const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

// Yapılandırmayı dışa aktar
router.get('/export', backupController.exportConfig);

// Yapılandırmayı içe aktar
router.post('/import', backupController.importConfig);

// İstatistikleri getir
router.get('/stats', backupController.getStats);

module.exports = router;
