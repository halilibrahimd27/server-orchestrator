import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { serverAPI, taskAPI, connectWebSocket } from './services/api';
import ServerList from './components/ServerList';
import TaskList from './components/TaskList';
import ExecutionLog from './components/ExecutionLog';

export default function App() {
  const [servers, setServers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedServers, setSelectedServers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadServers();
    loadTasks();

    // WebSocket connection
    const ws = connectWebSocket((data) => {
      if (data.type === 'execution_start') {
        setIsExecuting(true);
        setExecutionLog([{
          message: `${data.taskName} başlatıldı (${data.serverCount} sunucu)`,
          timestamp: new Date().toLocaleTimeString('tr-TR'),
          type: 'info'
        }]);
      } else if (data.type === 'output' || data.type === 'error') {
        setExecutionLog(prev => [...prev, {
          server: data.server,
          message: data.data,
          timestamp: new Date().toLocaleTimeString('tr-TR'),
          type: data.type
        }]);
      } else if (data.type === 'execution_complete') {
        setIsExecuting(false);
        setExecutionLog(prev => [...prev, {
          message: 'Görev tamamlandı!',
          timestamp: new Date().toLocaleTimeString('tr-TR'),
          type: 'success'
        }]);
        loadServers(); // Refresh server status
      }
    });

    return () => ws.close();
  }, []);

  const loadServers = async () => {
    try {
      const data = await serverAPI.getAll();
      setServers(data.servers || []);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await taskAPI.getAll();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleToggleServer = (action, ids) => {
    if (action === 'all') {
      setSelectedServers(ids);
    } else if (action === 'none') {
      setSelectedServers([]);
    } else {
      // Single toggle
      setSelectedServers(prev =>
        prev.includes(action) ? prev.filter(s => s !== action) : [...prev, action]
      );
    }
  };

  const handleAddServer = async (serverData) => {
    try {
      await serverAPI.create(serverData);
      loadServers();
    } catch (error) {
      alert('Sunucu eklenirken hata oluştu: ' + error.message);
      throw error;
    }
  };

  const handleDeleteServer = async (id) => {
    try {
      await serverAPI.delete(id);
      setSelectedServers(selectedServers.filter(s => s !== id));
      loadServers();
    } catch (error) {
      alert('Sunucu silinirken hata oluştu: ' + error.message);
    }
  };

  const handleTestConnection = async (serverId) => {
    try {
      const result = await serverAPI.test(serverId);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleToggleTask = (taskId) => {
    setSelectedTask(taskId === selectedTask ? null : taskId);
  };

  const handleAddTask = async (taskData) => {
    try {
      await taskAPI.create(taskData);
      loadTasks();
    } catch (error) {
      alert('Görev eklenirken hata oluştu: ' + error.message);
      throw error;
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await taskAPI.delete(id);
      if (selectedTask === id) {
        setSelectedTask(null);
      }
      loadTasks();
    } catch (error) {
      alert('Görev silinirken hata oluştu: ' + error.message);
    }
  };

  const handleExecuteTask = async () => {
    if (!selectedTask || selectedServers.length === 0) {
      alert('Lütfen hem sunucu hem de görev seçin!');
      return;
    }

    setIsExecuting(true);
    setExecutionLog([]);

    try {
      await taskAPI.execute(selectedTask, selectedServers, true);
      setTimeout(() => loadServers(), 2000);
    } catch (error) {
      setIsExecuting(false);
      alert('Görev çalıştırılırken hata oluştu: ' + error.message);
      setExecutionLog(prev => [...prev, {
        message: `HATA: ${error.message}`,
        timestamp: new Date().toLocaleTimeString('tr-TR'),
        type: 'error'
      }]);
    }
  };

  const handleClearLogs = () => {
    setExecutionLog([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Server Orchestrator
            </h1>
            <p className="text-slate-400 text-lg">
              {servers.length} sunucuyu tek tıkla yönet - {selectedServers.length} sunucu seçili
            </p>
          </div>
          <button
            onClick={() => {
              loadServers();
              loadTasks();
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all hover:scale-105 active:scale-95"
            title="Yenile"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Sidebar - Servers */}
          <div className="xl:col-span-4 h-[calc(100vh-180px)]">
            <ServerList
              servers={servers}
              selectedServers={selectedServers}
              onToggleServer={handleToggleServer}
              onAddServer={handleAddServer}
              onDeleteServer={handleDeleteServer}
              onTestConnection={handleTestConnection}
            />
          </div>

          {/* Middle - Tasks */}
          <div className="xl:col-span-3 h-[calc(100vh-180px)]">
            <TaskList
              tasks={tasks}
              selectedTask={selectedTask}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onExecuteTask={handleExecuteTask}
              selectedServersCount={selectedServers.length}
            />
          </div>

          {/* Right - Execution Logs */}
          <div className="xl:col-span-5 h-[calc(100vh-180px)]">
            <ExecutionLog
              logs={executionLog}
              isExecuting={isExecuting}
              onClearLogs={handleClearLogs}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-6 flex items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>{servers.length} Sunucu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>{tasks.length} Görev</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
            <span>{isExecuting ? 'Çalıştırılıyor...' : 'Hazır'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
