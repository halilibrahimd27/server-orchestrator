import React, { useState } from 'react';
import { Server, Trash2, CheckCircle, XCircle, Wifi, WifiOff, AlertCircle, Plus, X, Edit2 } from 'lucide-react';

const ServerCard = ({ server, isSelected, onToggle, onDelete, onTest, onEdit }) => {
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
      {/* Seçim İndikatörü */}
      <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all ${
        isSelected
          ? 'bg-blue-500 border-blue-400'
          : 'bg-slate-700 border-slate-600 group-hover:border-slate-500'
      }`}>
        {isSelected && <CheckCircle className="w-full h-full text-white" />}
      </div>

      {/* Sunucu Bilgisi */}
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
                {testResult === 'success' ? '✓ Çevrimiçi' : '✗ Çevrimdışı'}
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
            <span>•</span>
            <span>{new Date(server.created_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Aksiyon Butonları */}
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
              <span>Bağlantı Testi</span>
            </>
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(server);
          }}
          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors"
          title="Sunucuyu Düzenle"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`${server.name} sunucusunu silmek istediğinize emin misiniz?`)) {
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

const ServerForm = ({ onSubmit, onCancel, initialData = null, isEdit = false, groups = [] }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    private_key: '',
    sudo_password: ''
  });

  const [selectedGroups, setSelectedGroups] = useState([]);
  const [authType, setAuthType] = useState(initialData?.password ? 'password' : initialData?.private_key ? 'key' : 'password');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.host || !formData.username) {
      alert('Sunucu adı, host ve kullanıcı adı zorunludur!');
      return;
    }

    // Yeni sunucu eklerken şifre kontrolü yap
    if (!isEdit && authType === 'password' && !formData.password) {
      alert('Şifre zorunludur!');
      return;
    }

    onSubmit(formData, selectedGroups);
  };

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm p-6 rounded-xl border border-slate-700 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {isEdit ? 'Sunucu Düzenle' : 'Yeni Sunucu Ekle'}
        </h3>
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
            Sunucu Adı *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Örn: Production DB Server"
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
            Kullanıcı Adı *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            placeholder="root"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        {/* Kimlik Doğrulama Tipi */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Kimlik Doğrulama Yöntemi
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
              Şifre
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
              SSH Anahtarı
            </button>
          </div>
        </div>

        {authType === 'password' ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Şifre {!isEdit && '*'}
            </label>
            <input
              type="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder={isEdit ? "Değiştirmek için yeni şifre girin" : "••••••••"}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            {isEdit && (
              <p className="text-xs text-slate-500 mt-1">
                Boş bırakırsanız mevcut şifre korunur
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              SSH Private Key
            </label>
            <textarea
              value={formData.private_key || ''}
              onChange={(e) => setFormData({...formData, private_key: e.target.value})}
              placeholder={isEdit ? "Değiştirmek için yeni key girin" : "-----BEGIN RSA PRIVATE KEY-----\n..."}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono text-sm resize-none"
            />
            {isEdit && (
              <p className="text-xs text-slate-500 mt-1">
                Boş bırakırsanız mevcut key korunur
              </p>
            )}
          </div>
        )}

        {/* Sudo Şifresi Alanı */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Sudo Şifresi (Opsiyonel)
          </label>
          <input
            type="password"
            value={formData.sudo_password || ''}
            onChange={(e) => setFormData({...formData, sudo_password: e.target.value})}
            placeholder={isEdit ? "Değiştirmek için yeni sudo şifre girin" : "Sudo için şifre"}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
          <p className="text-xs text-slate-500 mt-1">
            {isEdit
              ? "Boş bırakırsanız mevcut sudo şifresi korunur. Komutlar sudo gerektiriyorsa bu alanı doldurun"
              : "Eğer komutlar sudo gerektiriyorsa, bu alanı doldurun"
            }
          </p>
        </div>

        {/* Grup Seçimi */}
        {groups.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Gruplar (Opsiyonel)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {groups.map(group => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    selectedGroups.includes(group.id)
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : 'bg-slate-800 border-2 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-sm">{group.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sunucuyu bir veya daha fazla gruba ekleyebilirsiniz
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/30"
          >
            {isEdit ? 'Güncelle' : 'Sunucu Ekle'}
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

export default function ServerList({
  servers,
  selectedServers,
  onToggleServer,
  onAddServer,
  onDeleteServer,
  onTestConnection,
  onEditServer,
  groups = []
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [filterGroupId, setFilterGroupId] = useState(null);

  const handleAddServer = async (serverData, selectedGroups) => {
    await onAddServer(serverData, selectedGroups);
    setShowAddForm(false);
  };

  const handleEditServer = async (serverData, selectedGroups) => {
    await onEditServer(editingServer.id, serverData, selectedGroups);
    setEditingServer(null);
  };

  const handleOpenEdit = (server) => {
    setEditingServer(server);
    setShowAddForm(false);
  };

  const handleSelectAll = () => {
    onToggleServer('all', servers.map(s => s.id));
  };

  const handleDeselectAll = () => {
    onToggleServer('none', []);
  };

  // Filter servers by group if a group is selected
  const filteredServers = filterGroupId
    ? servers.filter(server => server.groups && server.groups.some(g => g.id === filterGroupId))
    : servers;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 h-full flex flex-col">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Server className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Sunucular</h2>
            <p className="text-sm text-slate-400">
              {selectedServers.length} / {servers.length} seçili
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
          title={showAddForm ? 'İptal' : 'Sunucu Ekle'}
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSelectAll}
          className="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          Tümünü Seç ({servers.length})
        </button>
        <button
          onClick={handleDeselectAll}
          className="text-xs px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          Temizle
        </button>
      </div>

      {/* Grup Filtreleme */}
      {groups.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Gruba Göre Filtrele
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterGroupId(null)}
              className={`text-xs px-3 py-2 rounded-lg transition-all ${
                filterGroupId === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Tümü ({servers.length})
            </button>
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setFilterGroupId(group.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all ${
                  filterGroupId === group.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sunucu Ekleme/Düzenleme Formu */}
      {showAddForm && (
        <div className="mb-4">
          <ServerForm
            onSubmit={handleAddServer}
            onCancel={() => setShowAddForm(false)}
            isEdit={false}
            groups={groups}
          />
        </div>
      )}

      {editingServer && (
        <div className="mb-4">
          <ServerForm
            onSubmit={handleEditServer}
            onCancel={() => setEditingServer(null)}
            initialData={editingServer}
            isEdit={true}
            groups={groups}
          />
        </div>
      )}

      {/* Sunucu Listesi */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-4 bg-slate-700/30 rounded-full mb-4">
              <Server className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">Henüz sunucu yok</h3>
            <p className="text-sm text-slate-500 mb-4">
              Başlamak için yeni bir sunucu ekleyin
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              İlk Sunucuyu Ekle
            </button>
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-4 bg-slate-700/30 rounded-full mb-4">
              <Server className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">Bu grupta sunucu yok</h3>
            <p className="text-sm text-slate-500 mb-4">
              Seçilen grupta henüz sunucu bulunmuyor
            </p>
            <button
              onClick={() => setFilterGroupId(null)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Tüm Sunucuları Göster
            </button>
          </div>
        ) : (
          filteredServers.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              isSelected={selectedServers.includes(server.id)}
              onToggle={onToggleServer}
              onDelete={onDeleteServer}
              onTest={onTestConnection}
              onEdit={handleOpenEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
