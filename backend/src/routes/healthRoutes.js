const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Metrik endpoints
router.get('/summary', healthController.getHealthSummary);
router.get('/metrics', healthController.getAllServerMetrics);
router.get('/metrics/:serverId', healthController.getServerMetrics);
router.get('/metrics/:serverId/history', healthController.getServerMetricsHistory);
router.post('/collect/:serverId?', healthController.collectMetrics);

module.exports = router;
