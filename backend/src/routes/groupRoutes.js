const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Grup CRUD
router.get('/', groupController.getAllGroups);
router.post('/', groupController.createGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

// Grup-Sunucu ilişkileri
router.post('/members', groupController.addServerToGroup);
router.delete('/:groupId/members/:serverId', groupController.removeServerFromGroup);
router.get('/:id/servers', groupController.getGroupServers);
router.get('/server/:serverId', groupController.getServerGroups);

module.exports = router;
