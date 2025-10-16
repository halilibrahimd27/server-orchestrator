const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Get all tasks
router.get('/', taskController.getAllTasks);

// Get task by ID
router.get('/:id', taskController.getTaskById);

// Create new task
router.post('/', taskController.createTask);

// Update task
router.put('/:id', taskController.updateTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

// Execute task
router.post('/execute', taskController.executeTask);

// Get execution logs
router.get('/logs/all', taskController.getExecutionLogs);

module.exports = router;