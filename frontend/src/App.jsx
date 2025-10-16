import { useState, useEffect } from 'react';
import { RefreshCw, Activity, Layers, X } from 'lucide-react';
import { serverAPI, taskAPI, groupAPI, healthAPI, scheduleAPI, connectWebSocket } from './services/api';
import ServerList from './components/ServerList';
import TaskList from './components/TaskList';
import ExecutionLog from './components/ExecutionLog';
import ScheduleList from './components/ScheduleList';

export default function App() {
  const [servers, setServers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedServers, setSelectedServers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [groups, setGroups] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [schedules, setSchedules] = useState([]);

  // Load data on mount
  useEffect(() => {
    loadServers();
    loadTasks();
    loadGroups();
    loadHealthSummary();
    loadSchedules();

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

  const loadGroups = async () => {
    try {
      const data = await groupAPI.getAll();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadHealthSummary = async () => {
    try {
      const data = await healthAPI.getSummary();
      setHealthSummary(data.summary);
    } catch (error) {
      console.error('Failed to load health summary:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const data = await scheduleAPI.getAll();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Failed to load schedules:', error);
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

  const handleAddServer = async (serverData, selectedGroups = []) => {
    try {
      const result = await serverAPI.create(serverData);
      const serverId = result.server?.id;

      // Sunucu gruplarına ekle
      if (serverId && selectedGroups.length > 0) {
        for (const groupId of selectedGroups) {
          try {
            await groupAPI.addMember(groupId, serverId);
          } catch (err) {
            console.error(`Failed to add server to group ${groupId}:`, err);
          }
        }
      }

      loadServers();
    } catch (error) {
      alert('Sunucu eklenirken hata oluştu: ' + error.message);
      throw error;
    }
  };

  const handleEditServer = async (id, serverData, selectedGroups = []) => {
    try {
      await serverAPI.update(id, serverData);

      // Sunucu gruplarını güncelle
      if (selectedGroups.length > 0) {
        for (const groupId of selectedGroups) {
          try {
            await groupAPI.addMember(groupId, id);
          } catch (err) {
            console.error(`Failed to add server to group ${groupId}:`, err);
          }
        }
      }

      loadServers();
    } catch (error) {
      alert('Sunucu güncellenirken hata oluştu: ' + error.message);
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

  const handleEditTask = async (id, taskData) => {
    try {
      await taskAPI.update(id, taskData);
      loadTasks();
    } catch (error) {
      alert('Görev güncellenirken hata oluştu: ' + error.message);
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

  const handleAddSchedule = async (scheduleData) => {
    try {
      await scheduleAPI.create(scheduleData);
      loadSchedules();
    } catch (error) {
      alert('Zamanlama eklenirken hata oluştu: ' + error.message);
      throw error;
    }
  };

  const handleEditSchedule = async (id, scheduleData) => {
    try {
      await scheduleAPI.update(id, scheduleData);
      loadSchedules();
    } catch (error) {
      alert('Zamanlama güncellenirken hata oluştu: ' + error.message);
      throw error;
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await scheduleAPI.delete(id);
      loadSchedules();
    } catch (error) {
      alert('Zamanlama silinirken hata oluştu: ' + error.message);
    }
  };

  const handleToggleSchedule = async (id, enabled) => {
    try {
      await scheduleAPI.toggle(id, enabled);
      loadSchedules();
    } catch (error) {
      alert('Zamanlama durumu değiştirilirken hata oluştu: ' + error.message);
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
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Server Orchestrator <span className="text-xs text-slate-500 ml-2">v2.0</span>
              </h1>
              <p className="text-slate-400 text-sm">
                {servers.length} sunucu - {selectedServers.length} seçili
              </p>
            </div>
            <button
              onClick={() => {
                loadServers();
                loadTasks();
                loadGroups();
                loadHealthSummary();
                loadSchedules();
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
              title="Yenile"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setShowGroupsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              title="Grupları Görüntüle"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300">{groups.length} Grup</span>
            </button>

            {healthSummary && healthSummary.total_servers > 0 && (
              <>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 rounded-md">
                  <Activity className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-slate-300">{healthSummary.online_servers} Online</span>
                </div>

                {healthSummary.critical_servers.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-900/20 border border-red-500/30 rounded-md">
                    <Activity className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-300">{healthSummary.critical_servers.length} Kritik</span>
                  </div>
                )}

                {healthSummary.warning_servers.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-900/20 border border-yellow-500/30 rounded-md">
                    <Activity className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-yellow-300">{healthSummary.warning_servers.length} Uyarı</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Sidebar - Servers */}
          <div className="xl:col-span-3 h-[calc(100vh-200px)]">
            <ServerList
              servers={servers}
              selectedServers={selectedServers}
              onToggleServer={handleToggleServer}
              onAddServer={handleAddServer}
              onEditServer={handleEditServer}
              onDeleteServer={handleDeleteServer}
              onTestConnection={handleTestConnection}
              groups={groups}
            />
          </div>

          {/* Middle Column - Tasks & Schedules */}
          <div className="xl:col-span-4 space-y-6">
            {/* Tasks */}
            <div className="h-[calc(50vh-125px)]">
              <TaskList
                tasks={tasks}
                selectedTask={selectedTask}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onExecuteTask={handleExecuteTask}
                selectedServersCount={selectedServers.length}
              />
            </div>

            {/* Schedules */}
            <div className="h-[calc(50vh-125px)]">
              <ScheduleList
                schedules={schedules}
                tasks={tasks}
                servers={servers}
                onAddSchedule={handleAddSchedule}
                onEditSchedule={handleEditSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onToggleSchedule={handleToggleSchedule}
              />
            </div>
          </div>

          {/* Right - Execution Logs */}
          <div className="xl:col-span-5 h-[calc(100vh-200px)]">
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
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span>{schedules.filter(s => s.enabled).length} Aktif Zamanlama</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
            <span>{isExecuting ? 'Çalıştırılıyor...' : 'Hazır'}</span>
          </div>
        </div>

        {/* Groups Modal */}
        {showGroupsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowGroupsModal(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Sunucu Grupları</h2>
                <button
                  onClick={() => setShowGroupsModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {groups.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Henüz grup yok</p>
                ) : (
                  groups.map(group => (
                    <div
                      key={group.id}
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{group.name}</h3>
                          {group.description && (
                            <p className="text-sm text-slate-400 mt-1">{group.description}</p>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          {group.server_count} sunucu
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 <strong>İpucu:</strong> Sunucu eklerken veya düzenlerken birden fazla gruba ekleyebilirsiniz!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pb-8 border-t border-slate-700/50 pt-8">
          <div className="text-center space-y-3">
            <p className="text-slate-400 text-sm">
              Made with <span className="text-red-500">❤️</span> by{' '}
              <a
                href="https://fogeto.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                FOGETO
              </a>
            </p>
            <p className="text-slate-500 text-xs">
              Server Orchestrator v2.0 • SSH Task Automation & Monitoring Platform
            </p>
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} Fogeto All rights reserved
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
