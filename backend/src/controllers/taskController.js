const { getDatabase } = require('../config/database');
const { executeOnMultipleServers } = require('../services/sshExecutor');

// Get all tasks
exports.getAllTasks = (req, res) => {
  const db = getDatabase();
  
  db.all('SELECT * FROM tasks ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ tasks: rows });
  });
};

// Get task by ID
exports.getTaskById = (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ task: row });
  });
};

// Create new task
exports.createTask = (req, res) => {
  const db = getDatabase();
  const { name, description, command } = req.body;
  
  if (!name || !command) {
    return res.status(400).json({ error: 'Name and command are required' });
  }
  
  db.run(
    'INSERT INTO tasks (name, description, command) VALUES (?, ?, ?)',
    [name, description, command],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        message: 'Task created successfully',
        taskId: this.lastID
      });
    }
  );
};

// Update task
exports.updateTask = (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, description, command } = req.body;
  
  const updates = [];
  const values = [];
  
  if (name) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (command) { updates.push('command = ?'); values.push(command); }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  if (updates.length === 1) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  db.run(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task updated successfully' });
    }
  );
};

// Delete task
exports.deleteTask = (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  });
};

// Execute task on servers
exports.executeTask = async (req, res) => {
  const db = getDatabase();
  const { taskId, serverIds, parallel = true } = req.body;
  
  if (!taskId || !serverIds || serverIds.length === 0) {
    return res.status(400).json({ error: 'Task ID and server IDs are required' });
  }
  
  // Get task
  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], async (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get servers
    const placeholders = serverIds.map(() => '?').join(',');
    db.all(
      `SELECT * FROM servers WHERE id IN (${placeholders})`,
      serverIds,
      async (err, servers) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (servers.length === 0) {
          return res.status(404).json({ error: 'No servers found' });
        }
        
        // Broadcast start
        if (global.broadcastLog) {
          global.broadcastLog({
            type: 'execution_start',
            taskId: task.id,
            taskName: task.name,
            serverCount: servers.length
          });
        }
        
        try {
          // Execute task on all servers
          const results = await executeOnMultipleServers(
            servers,
            task.command,
            parallel
          );
          
          // Save execution logs
          const stmt = db.prepare(
            `INSERT INTO execution_logs (task_id, server_id, status, output, error, completed_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
          );
          
          results.forEach(result => {
            stmt.run(
              task.id,
              result.serverId,
              result.status,
              result.output || null,
              result.error || null
            );
          });
          
          stmt.finalize();
          
          // Broadcast completion
          if (global.broadcastLog) {
            global.broadcastLog({
              type: 'execution_complete',
              taskId: task.id,
              results: results
            });
          }
          
          res.json({
            message: 'Task execution completed',
            results: results
          });
          
        } catch (error) {
          res.status(500).json({
            error: 'Task execution failed',
            details: error.message
          });
        }
      }
    );
  });
};

// Get execution logs
exports.getExecutionLogs = (req, res) => {
  const db = getDatabase();
  const { limit = 50, taskId, serverId } = req.query;
  
  let query = `
    SELECT el.*, t.name as task_name, s.name as server_name
    FROM execution_logs el
    LEFT JOIN tasks t ON el.task_id = t.id
    LEFT JOIN servers s ON el.server_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (taskId) {
    query += ' AND el.task_id = ?';
    params.push(taskId);
  }
  
  if (serverId) {
    query += ' AND el.server_id = ?';
    params.push(serverId);
  }
  
  query += ' ORDER BY el.started_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ logs: rows });
  });
};