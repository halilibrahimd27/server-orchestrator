const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');

// Get all servers
router.get('/', serverController.getAllServers);

// Get server by ID
router.get('/:id', serverController.getServerById);

// Create new server
router.post('/', serverController.createServer);

// Update server
router.put('/:id', serverController.updateServer);

// Delete server
router.delete('/:id', serverController.deleteServer);

// Test server connection
router.post('/:id/test', serverController.testServerConnection);

module.exports = router;