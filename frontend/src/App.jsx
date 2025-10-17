import { useState, useEffect } from 'react';
import { RefreshCw, Activity, Layers, X, Settings, Download, Upload, BarChart3, Plus, Edit2, Trash2 } from 'lucide-react';
import { serverAPI, taskAPI, groupAPI, healthAPI, scheduleAPI, backupAPI, connectWebSocket } from './services/api';
import ServerList from './components/ServerList';
import TaskList from './components/TaskList';
import ExecutionLog from './components/ExecutionLog';
import ScheduleList from './components/ScheduleList';
import Terminal from './components/Terminal';

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
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'schedules' | 'groups' | 'backup'
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', color: '#3b82f6' });
  const [metrics, setMetrics] = useState([]);
  const [backupStats, setBackupStats] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadServers();
    loadTasks();
    loadGroups();
    loadHealthSummary();
    loadSchedules();
    loadMetrics();
    loadBackupStats();

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

  const loadMetrics = async () => {
    try {
      const data = await healthAPI.getMetrics();
      setMetrics(data.metrics || []);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const loadBackupStats = async () => {
    try {
      const data = await backupAPI.getStats();
      setBackupStats(data);
    } catch (error) {
      console.error('Failed to load backup stats:', error);
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

  // Group Management Functions
  const handleAddGroup = async () => {
    if (!groupForm.name) {
      alert('Grup adı zorunludur!');
      return;
    }

    try {
      await groupAPI.create(groupForm);
      loadGroups();
      setShowGroupForm(false);
      setGroupForm({ name: '', description: '', color: '#3b82f6' });
    } catch (error) {
      alert('Grup eklenirken hata oluştu: ' + error.message);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Bu grubu silmek istediğinize emin misiniz? Sunucular gruptan çıkarılacak.')) {
      return;
    }

    try {
      await groupAPI.delete(groupId);
      loadGroups();
    } catch (error) {
      alert('Grup silinirken hata oluştu: ' + error.message);
    }
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({ name: group.name, description: group.description || '', color: group.color });
    setShowGroupForm(true);
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
            <div className="flex gap-2">
              <button
                onClick={() => setShowBackupModal(true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                title="Yedekleme & Ayarlar"
              >
                <Settings className="w-5 h-5" />
              </button>
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

        {/* Main Layout - 2 Column */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column - Servers */}
          <div className="h-[calc(100vh-200px)]">
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

          {/* Right Column - Tabs (Tasks, Schedules, Logs) */}
          <div className="h-[calc(100vh-200px)] flex flex-col">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'tasks'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                Görevler
              </button>
              <button
                onClick={() => setActiveTab('schedules')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'schedules'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                Zamanlamalar
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'terminal'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                Terminal
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'logs'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                Loglar
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'tasks' && (
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
              )}

              {activeTab === 'schedules' && (
                <ScheduleList
                  schedules={schedules}
                  tasks={tasks}
                  servers={servers}
                  onAddSchedule={handleAddSchedule}
                  onEditSchedule={handleEditSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onToggleSchedule={handleToggleSchedule}
                />
              )}

              {activeTab === 'dashboard' && (
                <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 h-full overflow-y-auto">
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    {backupStats && (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-4">📊 Genel İstatistikler</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">Son 24 Saat</p>
                            <p className="text-3xl font-bold text-white">{backupStats.last24Hours}</p>
                            <p className="text-xs text-slate-500">Execution</p>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">Başarı Oranı</p>
                            <p className="text-3xl font-bold text-green-400">{backupStats.successRate}%</p>
                            <p className="text-xs text-slate-500">Son 7 Gün</p>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">Toplam Execution</p>
                            <p className="text-3xl font-bold text-blue-400">{backupStats.totalExecutions}</p>
                            <p className="text-xs text-slate-500">Tüm Zamanlar</p>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-1">Ortalama</p>
                            <p className="text-3xl font-bold text-purple-400">
                              {backupStats.totalExecutions > 0 ? Math.round(backupStats.totalExecutions / backupStats.totalServers) : 0}
                            </p>
                            <p className="text-xs text-slate-500">Per Server</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Health Metrics */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">💓 Sunucu Sağlık Durumu</h3>
                        <button
                          onClick={() => {
                            healthAPI.collectMetrics();
                            setTimeout(() => loadMetrics(), 2000);
                          }}
                          className="text-sm px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        >
                          Yenile
                        </button>
                      </div>
                      <div className="space-y-3">
                        {metrics.length === 0 ? (
                          <p className="text-center text-slate-400 py-8">Henüz metrik verisi yok. "Yenile" butonuna tıklayın.</p>
                        ) : (
                          metrics.slice(0, 10).map((metric) => {
                            const server = servers.find(s => s.id === metric.server_id);
                            return (
                              <div key={metric.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-white">{server?.name || `Server #${metric.server_id}`}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    metric.online ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {metric.online ? '● Online' : '● Offline'}
                                  </span>
                                </div>
                                {metric.online && (
                                  <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                      <p className="text-slate-400 text-xs">CPU</p>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full ${metric.cpu_usage_percent > 80 ? 'bg-red-500' : metric.cpu_usage_percent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${metric.cpu_usage_percent}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-white font-medium">{metric.cpu_usage_percent}%</span>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-slate-400 text-xs">RAM</p>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full ${metric.mem_usage_percent > 80 ? 'bg-red-500' : metric.mem_usage_percent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${metric.mem_usage_percent}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-white font-medium">{metric.mem_usage_percent}%</span>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-slate-400 text-xs">Disk</p>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full ${metric.disk_usage_percent > 80 ? 'bg-red-500' : metric.disk_usage_percent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${metric.disk_usage_percent}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-white font-medium">{metric.disk_usage_percent}%</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-slate-500 mt-2">
                                  Son güncelleme: {new Date(metric.timestamp).toLocaleString('tr-TR')}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'terminal' && (
                <Terminal servers={servers} />
              )}

              {activeTab === 'logs' && (
                <ExecutionLog
                  logs={executionLog}
                  isExecuting={isExecuting}
                  onClearLogs={handleClearLogs}
                />
              )}
            </div>
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
          {isExecuting && executionLog.length > 0 && activeTab !== 'logs' && (
            <button
              onClick={() => setActiveTab('logs')}
              className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs transition-colors"
            >
              Logları Görüntüle →
            </button>
          )}
        </div>

        {/* Groups Modal */}
        {showGroupsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowGroupsModal(false); setShowGroupForm(false); }}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-white">Sunucu Grupları</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowGroupForm(!showGroupForm)}
                    className={`p-2 rounded-lg transition-colors ${showGroupForm ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                    title={showGroupForm ? 'İptal' : 'Yeni Grup'}
                  >
                    {showGroupForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => { setShowGroupsModal(false); setShowGroupForm(false); }}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Grup Ekleme/Düzenleme Formu */}
                {showGroupForm && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-white">{editingGroup ? 'Grubu Düzenle' : 'Yeni Grup Ekle'}</h3>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Grup Adı *</label>
                      <input
                        type="text"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                        placeholder="Örn: Production"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Açıklama</label>
                      <input
                        type="text"
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                        placeholder="Grup açıklaması (opsiyonel)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Renk</label>
                      <div className="flex gap-2">
                        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                          <button
                            key={color}
                            onClick={() => setGroupForm({...groupForm, color})}
                            className={`w-8 h-8 rounded-lg transition-all ${groupForm.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleAddGroup}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      {editingGroup ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                )}

                {/* Grup Listesi */}
                <div className="space-y-2">
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
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white">{group.name}</h3>
                            {group.description && (
                              <p className="text-sm text-slate-400 mt-1">{group.description}</p>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 flex-shrink-0">
                            {group.server_count} sunucu
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => openEditGroup(group)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    💡 <strong>İpucu:</strong> Sunucu eklerken veya düzenlerken birden fazla gruba ekleyebilirsiniz!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backup Modal */}
        {showBackupModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBackupModal(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">Yedekleme & Ayarlar</h2>
                </div>
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* İstatistikler */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-slate-400">Toplam Sunucu</p>
                        <p className="text-2xl font-bold text-white">{servers.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-sm text-slate-400">Toplam Görev</p>
                        <p className="text-2xl font-bold text-white">{tasks.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-orange-400" />
                      <div>
                        <p className="text-sm text-slate-400">Aktif Zamanlama</p>
                        <p className="text-2xl font-bold text-white">{schedules.filter(s => s.enabled).length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Download className="w-6 h-6 text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Konfigürasyon Dışa Aktar</h3>
                      <p className="text-sm text-slate-400">Sunucu ve görev ayarlarınızı yedekleyin</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        backupAPI.exportConfig(false);
                      }}
                      className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Şifresiz Dışa Aktar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('⚠️ Şifreler de dahil edilecek. Güvenli bir yerde saklayın!')) {
                          backupAPI.exportConfig(true);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Şifrelerle Birlikte Dışa Aktar
                    </button>
                  </div>
                </div>

                {/* Import */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Upload className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Konfigürasyon İçe Aktar</h3>
                      <p className="text-sm text-slate-400">Yedek dosyasından ayarları geri yükleyin</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".json"
                      id="import-file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        try {
                          const result = await backupAPI.importConfig(file, false);
                          alert(`✅ İçe aktarma başarılı!\nSunucu: ${result.importedServers}\nGörev: ${result.importedTasks}`);
                          loadServers();
                          loadTasks();
                          setShowBackupModal(false);
                        } catch (err) {
                          alert('❌ İçe aktarma hatası: ' + err.message);
                        }
                      }}
                    />
                    <label
                      htmlFor="import-file"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <Upload className="w-5 h-5" />
                      Dosya Seç ve İçe Aktar
                    </label>
                    <p className="text-xs text-slate-500 text-center">
                      ⚠️ Mevcut veriler korunur, sadece yeniler eklenir
                    </p>
                  </div>
                </div>
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
