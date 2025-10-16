import { useState } from 'react';
import { Settings, Plus, X, Play, Trash2, Code, FileText, Edit2 } from 'lucide-react';

const TaskCard = ({ task, isSelected, onToggle, onDelete, onExecute, onEdit }) => {
  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70'
      }`}
    >
      {/* Selection Indicator */}
      <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all ${
        isSelected
          ? 'bg-purple-500 border-purple-400'
          : 'bg-slate-700 border-slate-600 group-hover:border-slate-500'
      }`}>
        {isSelected && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
        )}
      </div>

      {/* Task Info */}
      <div className="flex items-start gap-3 pr-8">
        <div className={`p-2.5 rounded-lg ${
          isSelected ? 'bg-purple-500/30' : 'bg-slate-700/50'
        }`}>
          <Code className={`w-5 h-5 ${isSelected ? 'text-purple-300' : 'text-slate-400'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-white truncate">{task.name}</h3>
          </div>

          {task.description && (
            <p className="text-sm text-slate-400 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
            <pre className="text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {task.command.length > 100 ? task.command.substring(0, 100) + '...' : task.command}
            </pre>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>{new Date(task.created_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors text-sm"
        >
          <Edit2 className="w-4 h-4" />
          <span>Düzenle</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`${task.name} görevini silmek istediğinize emin misiniz?`)) {
              onDelete(task.id);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Sil</span>
        </button>
      </div>
    </div>
  );
};

const TaskForm = ({ onSubmit, onCancel, initialData = null, isEdit = false }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    command: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.command) {
      alert('Görev adı ve komutu zorunludur!');
      return;
    }
    onSubmit(formData);
  };

  const quickTemplates = [
    {
      name: 'Redis Güncelleme 7 -> 8.2.2',
      command: 'docker pull redis:8.2.2-alpine && docker stop redis-container && docker rm redis-container && docker run -d --name redis-container -p 6379:6379 redis:8.2.2-alpine',
      description: 'Redis container güncellemesi'
    },
    {
      name: 'PostgreSQL Güncelleme',
      command: 'docker pull postgres:16-alpine && docker stop postgres-container && docker rm postgres-container && docker run -d --name postgres-container -e POSTGRES_PASSWORD=mypass -p 5432:5432 postgres:16-alpine',
      description: 'PostgreSQL container güncellemesi'
    },
    {
      name: 'Sistem Güncelleme (Ubuntu)',
      command: 'apt update && apt upgrade -y && apt autoremove -y',
      description: 'Ubuntu sistem güncellemesi'
    },
    {
      name: 'Docker Compose Deploy',
      command: 'cd /opt/myapp && docker-compose pull && docker-compose up -d --force-recreate',
      description: 'Docker Compose ile uygulama güncellemesi'
    }
  ];

  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = (template) => {
    setFormData({
      name: template.name,
      description: template.description,
      command: template.command
    });
    setShowTemplates(false);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm p-4 rounded-xl border border-slate-700 max-h-[500px] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-900 pb-2">
        <h3 className="text-base font-semibold text-white">
          {isEdit ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Templates - sadece yeni görev eklerken göster */}
      {!isEdit && (
        <div>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-left flex items-center justify-between transition-colors"
          >
            <span className="text-sm text-slate-300">Hızlı Şablonlar</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </button>

          {showTemplates && (
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-left transition-colors"
                >
                  <div className="font-medium text-sm text-white mb-1">{template.name}</div>
                  <div className="text-xs text-slate-400 truncate">{template.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Görev Adı *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Örn: Redis Güncelleme"
            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Açıklama
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Görev hakkında kısa açıklama (opsiyonel)"
            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Komut *
          </label>
          <textarea
            value={formData.command}
            onChange={(e) => setFormData({...formData, command: e.target.value})}
            placeholder="docker pull redis:8.2.2-alpine && ..."
            rows={4}
            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all font-mono resize-none"
          />
          <p className="mt-1 text-xs text-slate-500">
            && ile birleştirerek birden fazla komut çalıştırabilirsiniz
          </p>
        </div>

        <div className="flex gap-2 pt-2 sticky bottom-0 bg-slate-900 pb-1">
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-purple-500/20"
          >
            {isEdit ? 'Güncelle' : 'Görev Ekle'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

export default function TaskList({
  tasks,
  selectedTask,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onExecuteTask,
  onEditTask,
  selectedServersCount
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleAddTask = async (taskData) => {
    await onAddTask(taskData);
    setShowAddForm(false);
  };

  const handleEditTask = async (taskData) => {
    await onEditTask(editingTask.id, taskData);
    setEditingTask(null);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setShowAddForm(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Görevler</h2>
            <p className="text-sm text-slate-400">
              {tasks.length} görev tanımlı
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`p-2.5 rounded-lg transition-all ${
            showAddForm
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
          }`}
          title={showAddForm ? 'İptal' : 'Görev Ekle'}
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Add/Edit Task Form */}
      {showAddForm && (
        <div className="mb-4">
          <TaskForm
            onSubmit={handleAddTask}
            onCancel={() => setShowAddForm(false)}
            isEdit={false}
          />
        </div>
      )}

      {editingTask && (
        <div className="mb-4">
          <TaskForm
            onSubmit={handleEditTask}
            onCancel={() => setEditingTask(null)}
            initialData={editingTask}
            isEdit={true}
          />
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar mb-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-4 bg-slate-700/30 rounded-full mb-4">
              <Settings className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">Henüz görev yok</h3>
            <p className="text-sm text-slate-500 mb-4">
              Başlamak için yeni bir görev oluşturun
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              İlk Görevi Oluştur
            </button>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTask === task.id}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onExecute={onExecuteTask}
              onEdit={handleOpenEdit}
            />
          ))
        )}
      </div>

      {/* Execute Button */}
      {selectedTask && (
        <div className="pt-4 border-t border-slate-700">
          <button
            onClick={() => onExecuteTask(selectedTask)}
            disabled={selectedServersCount === 0}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6" />
            <span>
              Görevi Çalıştır
              {selectedServersCount > 0 && ` (${selectedServersCount} sunucu)`}
            </span>
          </button>
          {selectedServersCount === 0 && (
            <p className="text-center text-sm text-slate-500 mt-2">
              Önce sunucu seçin
            </p>
          )}
        </div>
      )}
    </div>
  );
}
