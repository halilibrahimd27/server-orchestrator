import { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Upload, Download, FolderOpen, Power } from 'lucide-react';

export default function Terminal({ servers }) {
  const [selectedServer, setSelectedServer] = useState(null);
  const [showFileManager, setShowFileManager] = useState(false);
  const [connected, setConnected] = useState(false);
  const terminalRef = useRef(null);
  const wsRef = useRef(null);
  const [terminalOutput, setTerminalOutput] = useState('');

  // Terminal bağlantısı
  const connectToServer = (server) => {
    setSelectedServer(server);
    setConnected(false);
    setTerminalOutput('');

    // WebSocket bağlantısı
    const ws = new WebSocket(`ws://localhost:8081?serverId=${server.id}`);

    ws.onopen = () => {
      setConnected(true);
      console.log('✅ Terminal bağlantısı kuruldu');
    };

    ws.onmessage = (event) => {
      // Gelen veriyi terminale ekle
      setTerminalOutput(prev => prev + event.data);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket hatası:', error);
      setTerminalOutput(prev => prev + '\r\n\r\n❌ Bağlantı hatası!\r\n');
    };

    ws.onclose = () => {
      setConnected(false);
      setTerminalOutput(prev => prev + '\r\n\r\n🔴 Bağlantı kapatıldı\r\n');
      console.log('🔴 Terminal bağlantısı kapandı');
    };

    wsRef.current = ws;
  };

  // Bağlantıyı kes
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setSelectedServer(null);
    setConnected(false);
    setTerminalOutput('');
  };

  // Klavye input'u yakala
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!connected || !wsRef.current) return;

      // Özel tuşlar
      if (e.key === 'Enter') {
        wsRef.current.send('\r');
      } else if (e.key === 'Backspace') {
        wsRef.current.send('\x7F');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        wsRef.current.send('\t');
      } else if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        wsRef.current.send('\x03'); // Ctrl+C
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        wsRef.current.send('\x04'); // Ctrl+D
      } else if (e.key.length === 1) {
        wsRef.current.send(e.key);
      }
    };

    if (terminalRef.current) {
      terminalRef.current.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      if (terminalRef.current) {
        terminalRef.current.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [connected]);

  // Terminal'e focus ver
  useEffect(() => {
    if (connected && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [connected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${connected ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
            <TerminalIcon className={`w-6 h-6 ${connected ? 'text-green-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">SSH Terminal</h2>
            <p className="text-sm text-slate-400">
              {selectedServer ? (
                <>
                  {selectedServer.name} ({selectedServer.host}:{selectedServer.port})
                  {connected && <span className="ml-2 text-green-400">● Bağlı</span>}
                </>
              ) : 'Sunucu seçin'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {connected && (
            <>
              <button
                onClick={() => setShowFileManager(!showFileManager)}
                className={`px-3 py-2 rounded-lg transition-colors ${showFileManager ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                title="Dosya Yöneticisi"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
              <button
                onClick={disconnect}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                title="Bağlantıyı Kes"
              >
                <Power className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Server Selector */}
      {!selectedServer && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <TerminalIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-4">SSH Bağlantısı Kur</h3>
            <p className="text-sm text-slate-500 mb-6">Bağlanmak için bir sunucu seçin</p>
            <div className="grid grid-cols-2 gap-3 max-w-2xl">
              {servers.length === 0 ? (
                <p className="col-span-2 text-slate-500">Henüz sunucu yok</p>
              ) : (
                servers.map(server => (
                  <button
                    key={server.id}
                    onClick={() => connectToServer(server)}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-green-500 rounded-lg transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="font-semibold text-white">{server.name}</div>
                    </div>
                    <div className="text-sm text-slate-400 font-mono">{server.username}@{server.host}:{server.port}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terminal Screen */}
      {selectedServer && !showFileManager && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={terminalRef}
            tabIndex={0}
            className="flex-1 overflow-auto p-4 font-mono text-sm bg-black text-green-400 cursor-text focus:outline-none focus:ring-2 focus:ring-green-500/50"
            style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace'
            }}
          >
            {terminalOutput || 'Bağlanıyor...'}
          </div>

          {/* Info Bar */}
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <div>
                💡 <strong>İpucu:</strong> Terminal'e tıklayın ve yazmaya başlayın. Enter, Backspace, Tab, Ctrl+C desteklenir.
              </div>
              <div className="flex gap-4">
                <span>Ctrl+C: İptal</span>
                <span>Ctrl+D: Çıkış</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Manager */}
      {selectedServer && showFileManager && (
        <FileManager server={selectedServer} onClose={() => setShowFileManager(false)} />
      )}
    </div>
  );
}

// File Manager Component
function FileManager({ server, onClose }) {
  const [currentPath, setCurrentPath] = useState('~');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files/list/${server.id}?remotePath=${encodeURIComponent(currentPath)}`);
      const data = await response.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Dosya listesi alınamadı:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const handleUpload = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('remotePath', currentPath);

    try {
      const response = await fetch(`/api/files/upload/${server.id}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Dosya başarıyla yüklendi!');
        setUploadFile(null);
        loadFiles();
      } else {
        alert('❌ Hata: ' + data.error);
      }
    } catch (error) {
      alert('❌ Yükleme hatası: ' + error.message);
    }
  };

  const handleDownload = async (fileName) => {
    const remotePath = `${currentPath}/${fileName}`.replace('//', '/');

    try {
      const response = await fetch(`/api/files/download/${server.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remotePath })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert('❌ Hata: ' + data.error);
      }
    } catch (error) {
      alert('❌ İndirme hatası: ' + error.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white outline-none focus:border-blue-500"
            placeholder="Yol girin..."
          />
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Yükle
          </button>
        </div>

        {/* Upload */}
        <div className="flex gap-2">
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={!uploadFile}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700 p-2">
        {loading ? (
          <p className="text-center text-slate-400 py-8">Yükleniyor...</p>
        ) : files.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Dosya bulunamadı</p>
        ) : (
          <div className="space-y-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-800/50 hover:bg-slate-800 rounded transition-colors"
              >
                <div className="flex-1">
                  <div className="font-mono text-sm text-white">{file.name}</div>
                  <div className="text-xs text-slate-500">
                    {file.type === 'directory' ? '📁 Dizin' : `📄 ${(file.size / 1024).toFixed(2)} KB`}
                  </div>
                </div>
                {file.type === 'file' && (
                  <button
                    onClick={() => handleDownload(file.name)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors"
                    title="İndir"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
