import React, { useState } from 'react';
import { Clock, Calendar, Play, Pause, Trash2, Plus, X, Edit2 } from 'lucide-react';

const ScheduleCard = ({ schedule, onToggle, onDelete, onEdit, servers, tasks }) => {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try {
      await onToggle(schedule.id, !schedule.enabled);
    } finally {
      setToggling(false);
    }
  };

  const getServerNames = () => {
    if (!schedule.server_ids || !Array.isArray(schedule.server_ids)) return [];
    return schedule.server_ids
      .map(id => servers.find(s => s.id === id)?.name || `Server #${id}`)
      .slice(0, 3);
  };

  const formatNextRun = (nextRun) => {
    if (!nextRun) return 'Belirlenmedi';
    const date = new Date(nextRun);
    const now = new Date();
    const diff = date - now;

    if (diff < 0) return 'Geçmiş';
    if (diff < 60000) return 'Yakında';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dk sonra`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat sonra`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatSchedule = () => {
    if (schedule.schedule_type === 'interval') {
      const minutes = parseInt(schedule.schedule_value);
      if (minutes < 60) return `Her ${minutes} dakika`;
      if (minutes < 1440) return `Her ${Math.floor(minutes / 60)} saat`;
      return `Her ${Math.floor(minutes / 1440)} gün`;
    }
    return schedule.schedule_value; // cron expression
  };

  const serverNames = getServerNames();
  const remainingCount = schedule.server_ids ? schedule.server_ids.length - 3 : 0;

  return (
    <div className={`group p-4 rounded-lg border-2 transition-all duration-200 ${
      schedule.enabled
        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        : 'bg-slate-800/30 border-slate-700/50 opacity-60'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg ${
          schedule.enabled ? 'bg-blue-500/20' : 'bg-slate-700/30'
        }`}>
          <Clock className={`w-5 h-5 ${schedule.enabled ? 'text-blue-400' : 'text-slate-500'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{schedule.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              schedule.enabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-500/20 text-slate-400'
            }`}>
              {schedule.enabled ? 'Aktif' : 'Pasif'}
            </span>
          </div>

          <div className="text-sm text-slate-400 mb-2">
            <span className="font-mono text-blue-400">{schedule.task_name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatSchedule()}
            </span>
            <span>•</span>
            <span>Sonraki: {formatNextRun(schedule.next_run)}</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {serverNames.map((name, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-slate-400">
                {name}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-slate-400">
                +{remainingCount} daha
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors text-sm disabled:opacity-50"
        >
          {toggling ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : schedule.enabled ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Duraklat</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Başlat</span>
            </>
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(schedule);
          }}
          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors"
          title="Zamanlamayı Düzenle"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`${schedule.name} zamanlamasını silmek istediğinize emin misiniz?`)) {
              onDelete(schedule.id);
            }
          }}
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
          title="Zamanlamayı Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ScheduleForm = ({ onSubmit, onCancel, initialData = null, isEdit = false, tasks = [], servers = [] }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    task_id: '',
    server_ids: [],
    schedule_type: 'interval',
    schedule_value: '60',
    enabled: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.task_id || formData.server_ids.length === 0 || !formData.schedule_value) {
      alert('Tüm alanları doldurun ve en az bir sunucu seçin!');
      return;
    }

    onSubmit(formData);
  };

  const toggleServer = (serverId) => {
    setFormData(prev => ({
      ...prev,
      server_ids: prev.server_ids.includes(serverId)
        ? prev.server_ids.filter(id => id !== serverId)
        : [...prev.server_ids, serverId]
    }));
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm p-6 rounded-xl border border-slate-700 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {isEdit ? 'Zamanlamayı Düzenle' : 'Yeni Zamanlama Ekle'}
        </h3>
        <button onClick={onCancel} className="p-1 hover:bg-slate-800 rounded transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Zamanlama Adı *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Örn: Günlük Yedekleme"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Görev *
          </label>
          <select
            value={formData.task_id}
            onChange={(e) => setFormData({...formData, task_id: parseInt(e.target.value)})}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          >
            <option value="">Görev Seçin</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Zamanlama Türü
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({...formData, schedule_type: 'interval', schedule_value: '60'})}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                formData.schedule_type === 'interval'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Periyodik
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, schedule_type: 'cron', schedule_value: '0 0 * * *'})}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                formData.schedule_type === 'cron'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Cron
            </button>
          </div>
        </div>

        {formData.schedule_type === 'interval' ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Süre (Dakika) *
            </label>
            <input
              type="number"
              min="1"
              value={formData.schedule_value}
              onChange={(e) => setFormData({...formData, schedule_value: e.target.value})}
              placeholder="60"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">
              Her {formData.schedule_value || '?'} dakikada bir çalışacak
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cron İfadesi *
            </label>
            <input
              type="text"
              value={formData.schedule_value}
              onChange={(e) => setFormData({...formData, schedule_value: e.target.value})}
              placeholder="0 0 * * *"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Örnek: "0 0 * * *" her gün gece yarısı, "0 */6 * * *" her 6 saatte bir
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Sunucular * ({formData.server_ids.length} seçili)
          </label>
          <div className="max-h-48 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg p-2 space-y-1">
            {servers.length === 0 ? (
              <p className="text-sm text-slate-500 p-2">Henüz sunucu yok</p>
            ) : (
              servers.map(server => (
                <label
                  key={server.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    formData.server_ids.includes(server.id)
                      ? 'bg-blue-500/20 hover:bg-blue-500/30'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.server_ids.includes(server.id)}
                    onChange={() => toggleServer(server.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-white">{server.name}</span>
                  <span className="text-xs text-slate-500">({server.host})</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enabled"
            checked={formData.enabled}
            onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
            className="w-4 h-4"
          />
          <label htmlFor="enabled" className="text-sm text-slate-300">
            Zamanlamayı hemen etkinleştir
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/30"
          >
            {isEdit ? 'Güncelle' : 'Zamanlama Ekle'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

export default function ScheduleList({
  schedules,
  tasks,
  servers,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onToggleSchedule
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const handleAddSchedule = async (scheduleData) => {
    await onAddSchedule(scheduleData);
    setShowAddForm(false);
  };

  const handleEditSchedule = async (scheduleData) => {
    await onEditSchedule(editingSchedule.id, scheduleData);
    setEditingSchedule(null);
  };

  const handleOpenEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowAddForm(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 h-full flex flex-col">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Zamanlamalar</h2>
            <p className="text-sm text-slate-400">
              {schedules.filter(s => s.enabled).length} aktif / {schedules.length} toplam
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`p-2.5 rounded-lg transition-all ${
            showAddForm
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
          }`}
          title={showAddForm ? 'İptal' : 'Zamanlama Ekle'}
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Zamanlama Ekleme/Düzenleme Formu */}
      {showAddForm && (
        <div className="mb-4">
          <ScheduleForm
            onSubmit={handleAddSchedule}
            onCancel={() => setShowAddForm(false)}
            isEdit={false}
            tasks={tasks}
            servers={servers}
          />
        </div>
      )}

      {editingSchedule && (
        <div className="mb-4">
          <ScheduleForm
            onSubmit={handleEditSchedule}
            onCancel={() => setEditingSchedule(null)}
            initialData={editingSchedule}
            isEdit={true}
            tasks={tasks}
            servers={servers}
          />
        </div>
      )}

      {/* Zamanlama Listesi */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-4 bg-slate-700/30 rounded-full mb-4">
              <Clock className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">Henüz zamanlama yok</h3>
            <p className="text-sm text-slate-500 mb-4">
              Görevlerinizi otomatik olarak çalıştırmak için zamanlama ekleyin
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              İlk Zamanlamayı Ekle
            </button>
          </div>
        ) : (
          schedules.map(schedule => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onToggle={onToggleSchedule}
              onDelete={onDeleteSchedule}
              onEdit={handleOpenEdit}
              servers={servers}
              tasks={tasks}
            />
          ))
        )}
      </div>
    </div>
  );
}
