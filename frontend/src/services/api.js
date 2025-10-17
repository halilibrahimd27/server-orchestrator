const API_URL = '/api';

// Servers
export const serverAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/servers`);
    return res.json();
  },
  
  getById: async (id) => {
    const res = await fetch(`${API_URL}/servers/${id}`);
    return res.json();
  },
  
  create: async (data) => {
    const res = await fetch(`${API_URL}/servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/servers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  delete: async (id) => {
    const res = await fetch(`${API_URL}/servers/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  
  test: async (id) => {
    const res = await fetch(`${API_URL}/servers/${id}/test`, {
      method: 'POST'
    });
    return res.json();
  }
};

// Tasks
export const taskAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/tasks`);
    return res.json();
  },
  
  getById: async (id) => {
    const res = await fetch(`${API_URL}/tasks/${id}`);
    return res.json();
  },
  
  create: async (data) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  update: async (id, data) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  delete: async (id) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  
  execute: async (taskId, serverIds, parallel = true) => {
    const res = await fetch(`${API_URL}/tasks/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, serverIds, parallel })
    });
    return res.json();
  },
  
  getLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/tasks/logs/all?${query}`);
    return res.json();
  }
};

// Groups (NEW in v2.0)
export const groupAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/groups`);
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_URL}/groups/${id}`);
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/groups/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  getServers: async (groupId) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/servers`);
    return res.json();
  },

  addMember: async (groupId, serverId) => {
    const res = await fetch(`${API_URL}/groups/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, serverId })
    });
    return res.json();
  },

  removeMember: async (groupId, serverId) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/members/${serverId}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};

// Health Monitoring (NEW in v2.0)
export const healthAPI = {
  getSummary: async () => {
    const res = await fetch(`${API_URL}/health/summary`);
    return res.json();
  },

  getMetrics: async () => {
    const res = await fetch(`${API_URL}/health/metrics`);
    return res.json();
  },

  collectMetrics: async () => {
    const res = await fetch(`${API_URL}/health/collect`, {
      method: 'POST'
    });
    return res.json();
  }
};

// Schedules (NEW in v2.0)
export const scheduleAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/schedules`);
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/schedules/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  toggle: async (id, enabled) => {
    const res = await fetch(`${API_URL}/schedules/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    return res.json();
  }
};

// Backup & Export/Import (NEW)
export const backupAPI = {
  exportConfig: async (includePasswords = false) => {
    const res = await fetch(`${API_URL}/backup/export?includePasswords=${includePasswords}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `server-orchestrator-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return { success: true };
  },

  importConfig: async (file, replaceExisting = false) => {
    const fileContent = await file.text();
    const data = JSON.parse(fileContent);

    const res = await fetch(`${API_URL}/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, replaceExisting })
    });
    return res.json();
  },

  getStats: async () => {
    const res = await fetch(`${API_URL}/backup/stats`);
    return res.json();
  }
};

// WebSocket connection
export const connectWebSocket = (onMessage) => {
  let ws = null;
  let reconnectTimeout = null;

  const connect = () => {
    try {
      ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onerror = (error) => {
        // Suppress error logging - it's expected on initial connection
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected - reconnecting in 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      reconnectTimeout = setTimeout(connect, 3000);
    }
  };

  connect();

  return {
    close: () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    }
  };
};