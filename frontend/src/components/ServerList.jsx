import React, { useState } from 'react';
import { Server, Trash2, CheckCircle, XCircle, Wifi, WifiOff, AlertCircle, Plus, X } from 'lucide-react';

const ServerCard = ({ server, isSelected, onToggle, onDelete, onTest }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async (e) => {
    e.stopPropagation();
    setTesting(true);
    setTestResult(null);

    try {
      const result = await onTest(server.id);
      setTestResult(result.success ? 'success' : 'error');
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      setTestResult('error');
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      onClick={() => onToggle(server.id)}
      className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70'
      }`}
    >
      {/* Selection Indicator */}
      <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all ${
        isSelected
          ? 'bg-blue-500 border-blue-400'
          : 'bg-slate-700 border-slate-600 group-hover:border-slate-500'
      }`}>
        {isSelected && <CheckCircle className="w-full h-full text-white" />}
      </div>

      {/* Server Info */}
      <div className="flex items-start gap-3 pr-8">
        <div className={`p-2.5 rounded-lg ${
          isSelected ? 'bg-blue-500/30' : 'bg-slate-700/50'
        }`}>
          <Server className={`w-5 h-5 ${isSelected ? 'text-blue-300' : 'text-slate-400'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{server.name}</h3>
            {testResult && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                testResult === 'success'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {testResult === 'success' ? ' Online' : ' Offline'}
              </span>
            )}
          </div>

          <div className="text-sm text-slate-400 flex items-center gap-1.5 mb-2">
            <span className="font-mono">{server.host}</span>
            <span>:</span>
            <span className="font-mono">{server.port}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>@{server.username}</span>
            <span>"</span>
            <span>{new Date(server.created_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors text-sm disabled:opacity-50"
        >
          {testing ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>Test ediliyor...</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>Balant1 Testi</span>
            </>
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`${server.name} sunucusunu silmek istediinize emin misiniz?`)) {
              onDelete(server.id);
            }
          }}
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
          title="Sunucuyu Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const AddServerForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    private_key: ''
  });

  const [authType, setAuthType] = useState('password'); // 'password' or 'key'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.host || !formData.username) {
      alert('Sunucu ad1, host ve kullan1c1 ad1 zorunludur!');
      return;
    }

    if (authType === 'password' && !formData.password) {
      alert('^ifre zorunludur!');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm p-6 rounded-xl border border-slate-700 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Yeni Sunucu Ekle</h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Sunucu Ad1 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="�rn: Production DB Server"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Host / IP Adresi *
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => setFormData({...formData, host: e.target.value})}
              placeholder="192.168.1.100"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Port
            </label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Kullan1c1 Ad1 *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            placeholder="root"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        {/* Auth Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Kimlik Dorulama Tipi
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAuthType('password')}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                authType === 'password'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              ^ifre
            </button>
            <button
              type="button"
              onClick={() => setAuthType('key')}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                authType === 'key'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              SSH Key
            </button>
          </div>
        </div>

        {authType === 'password' ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ^ifre *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              SSH Private Key
            </label>
            <textarea
              value={formData.private_key}
              onChange={(e) => setFormData({...formData, private_key: e.target.value})}
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;..."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono text-sm resize-none"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/30"
          >
            Sunucu Ekle
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            0ptal
          </button>
        </div>
      </form>
    </div>
  );
};

export default function ServerList({
  servers,
  selectedServers,
  onToggleServer,
  onAddServer,
  onDeleteServer,
  onTestConnection
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddServer = async (serverData) => {
    await onAddServer(serverData);
    setShowAddForm(false);
  };

  const handleSelectAll = () => {
    onToggleServer('all', servers.map(s => s.id));
  };

  const handleDeselectAll = () => {
    onToggleServer('none', []);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Server className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Sunucular</h2>
            <p className="text-sm text-slate-400">
              {selectedServers.length} / {servers.length} se�ili
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
          title={showAddForm ? '0ptal' : 'Sunucu Ekle'}
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSelectAll}
          className="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          T�m�n� Se� ({servers.length})
        </button>
        <button
          onClick={handleDeselectAll}
          className="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          Temizle
        </button>
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <div className="mb-4">
          <AddServerForm
            onSubmit={handleAddServer}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Server List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-4 bg-slate-700/30 rounded-full mb-4">
              <Server className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">Hen�z sunucu yok</h3>
            <p className="text-sm text-slate-500 mb-4">
              Ba_lamak i�in yeni bir sunucu ekleyin
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              0lk Sunucuyu Ekle
            </button>
          </div>
        ) : (
          servers.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              isSelected={selectedServers.includes(server.id)}
              onToggle={onToggleServer}
              onDelete={onDeleteServer}
              onTest={onTestConnection}
            />
          ))
        )}
      </div>
    </div>
  );
}
