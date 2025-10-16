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

// WebSocket connection
export const connectWebSocket = (onMessage) => {
  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    console.log('✅ WebSocket connected');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };

  return ws;
};