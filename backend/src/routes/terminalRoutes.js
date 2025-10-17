const express = require('express');
const router = express.Router();
const terminalController = require('../controllers/terminalController');

// Terminal endpoints
router.post('/connect/:serverId', terminalController.connect);

module.exports = router;
