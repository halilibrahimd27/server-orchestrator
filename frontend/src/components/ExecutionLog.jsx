import { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle, XCircle, AlertCircle, Loader, Trash2, Download, Filter } from 'lucide-react';

const LogEntry = ({ log, index }) => {
  const getLogIcon = () => {
    switch (log.type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
      case 'info':
        return <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />;
      default:
        return <Terminal className="w-4 h-4 text-slate-400 flex-shrink-0" />;
    }
  };

  const getLogStyle = () => {
    switch (log.type) {
      case 'error':
        return 'bg-red-900/20 border-red-800/30 text-red-200';
      case 'success':
        return 'bg-green-900/20 border-green-800/30 text-green-200';
      case 'info':
        return 'bg-blue-900/20 border-blue-800/30 text-blue-200';
      default:
        return 'bg-slate-800/50 border-slate-700/50 text-slate-300';
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border ${getLogStyle()} font-mono text-xs transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-2">
        {getLogIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            {log.server && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-purple-300 font-semibold">
                {log.server}
              </span>
            )}
            <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
          </div>
          <div className="whitespace-pre-wrap break-words">{log.message}</div>
        </div>
      </div>
    </div>
  );
};

const ExecutionStats = ({ logs }) => {
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.type === 'success' || l.type === 'output').length,
    errors: logs.filter(l => l.type === 'error').length,
    info: logs.filter(l => l.type === 'info').length
  };

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-slate-400 mb-1">Toplam</div>
        <div className="text-2xl font-bold text-white">{stats.total}</div>
      </div>
      <div className="bg-green-900/20 rounded-lg p-3 border border-green-800/30">
        <div className="text-xs text-green-400 mb-1">Başarılı</div>
        <div className="text-2xl font-bold text-green-300">{stats.success}</div>
      </div>
      <div className="bg-red-900/20 rounded-lg p-3 border border-red-800/30">
        <div className="text-xs text-red-400 mb-1">Hata</div>
        <div className="text-2xl font-bold text-red-300">{stats.errors}</div>
      </div>
      <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-800/30">
        <div className="text-xs text-blue-400 mb-1">Bilgi</div>
        <div className="text-2xl font-bold text-blue-300">{stats.info}</div>
      </div>
    </div>
  );
};

export default function ExecutionLog({ logs, isExecuting, onClearLogs }) {
  const [filter, setFilter] = useState('all'); // 'all', 'error', 'success', 'info'
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs
    .filter(log => filter === 'all' || log.type === filter)
    .filter(log => searchTerm === '' || log.message.toLowerCase().includes(searchTerm.toLowerCase()) || (log.server && log.server.toLowerCase().includes(searchTerm.toLowerCase())));

  const downloadLogs = () => {
    const logText = logs.map(log =>
      `[${log.timestamp}] ${log.server ? `[${log.server}]` : ''} ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-log-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isExecuting ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
            {isExecuting ? (
              <Loader className="w-6 h-6 text-green-400 animate-spin" />
            ) : (
              <Terminal className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Çalıştırma Logları</h2>
            <p className="text-sm text-slate-400">
              {isExecuting ? 'Görev çalıştırılıyor...' : `${logs.length} log girişi`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white outline-none cursor-pointer appearance-none pr-8"
            >
              <option value="all">Tüm Loglar</option>
              <option value="info">Bilgi</option>
              <option value="output">Çıktı</option>
              <option value="error">Hatalar</option>
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Auto-scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              autoScroll
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
            title={autoScroll ? 'Otomatik kaydır: Açık' : 'Otomatik kaydır: Kapalı'}
          >
            Auto
          </button>

          {logs.length > 0 && (
            <>
              <button
                onClick={downloadLogs}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                title="Logları indir"
              >
                <Download className="w-5 h-5 text-slate-300" />
              </button>

              <button
                onClick={onClearLogs}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                title="Logları temizle"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {logs.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Log içinde ara... (mesaj veya sunucu adı)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
          {searchTerm && (
            <p className="text-xs text-slate-400 mt-2">
              {filteredLogs.length} / {logs.length} log gösteriliyor
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      {logs.length > 0 && <ExecutionStats logs={filteredLogs} />}

      {/* Log Container */}
      <div
        ref={logContainerRef}
        className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-slate-700/30 rounded-full mb-4">
              <Terminal className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">
              {logs.length === 0 ? 'Henüz log yok' : 'Filtre sonucu yok'}
            </h3>
            <p className="text-sm text-slate-500">
              {logs.length === 0
                ? 'Bir görev çalıştırdığınızda loglar burada görünür'
                : 'Seçilen filtreye uygun log bulunamadı'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <LogEntry key={index} log={log} index={index} />
          ))
        )}

        {/* Live Indicator */}
        {isExecuting && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm text-green-400">Görev devam ediyor...</span>
          </div>
        )}
      </div>
    </div>
  );
}
