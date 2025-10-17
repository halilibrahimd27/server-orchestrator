const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const multer = require('multer');

// Multer configuration for file uploads
const upload = multer({ dest: '/tmp/uploads/' });

// File transfer endpoints
router.post('/upload/:serverId', upload.single('file'), fileController.uploadFile);
router.post('/download/:serverId', fileController.downloadFile);
router.get('/list/:serverId', fileController.listFiles);

module.exports = router;
