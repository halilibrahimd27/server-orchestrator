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